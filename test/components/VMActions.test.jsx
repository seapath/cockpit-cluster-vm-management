/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import VMActions from '../../src/components/VMActions.jsx';
import { respond } from '../helpers/spawn.js';

const vmList = [
    { id: 1, name: 'vm1', state: 'running', defaultNode: 'prefer: hyp1', currentNode: 'hyp1' },
];

function renderActions(selectedVM = null) {
    const refreshVMList = vi.fn(() => Promise.resolve());
    const updateSelectedVM = vi.fn();
    const ref = React.createRef();
    const view = render(
        <VMActions
            ref={ref}
            VMlist={vmList}
            selectedVM={selectedVM}
            refreshVMList={refreshVMList}
            updateSelectedVM={updateSelectedVM}
        />
    );
    return { ref, refreshVMList, updateSelectedVM, view };
}

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('VMActions', () => {
    it('disables every action until a VM is selected', () => {
        renderActions(null);

        expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    });

    it('enables the actions once a VM is selected', () => {
        const { view } = renderActions(null);

        view.rerender(
            <VMActions
                VMlist={vmList}
                selectedVM={vmList[0]}
                refreshVMList={() => {}}
                updateSelectedVM={() => {}}
            />
        );

        expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
    });

    it('runs a vm-mgr action and refreshes the selected VM', async () => {
        respond({ 'vm-mgr start -n vm1': 'ok' });
        const { ref, refreshVMList, updateSelectedVM } = renderActions(vmList[0]);

        await act(async () => {
            await ref.current.handleActionVmMgr('start');
        });

        expect(cockpit.spawn).toHaveBeenCalledWith(['vm-mgr', 'start', '-n', 'vm1'], { superuser: 'try' });
        expect(refreshVMList).toHaveBeenCalled();
        expect(updateSelectedVM).toHaveBeenCalledWith(vmList[0]);
    });

    it('forwards extra arguments to the vm-mgr action', async () => {
        respond({ 'vm-mgr stop -n vm1 --force': 'ok' });
        const { ref } = renderActions(vmList[0]);

        await act(async () => {
            await ref.current.handleActionVmMgr('stop', ['--force']);
        });

        expect(cockpit.spawn).toHaveBeenCalledWith(
            ['vm-mgr', 'stop', '-n', 'vm1', '--force'],
            { superuser: 'try' }
        );
    });

    it('runs a crm resource action', async () => {
        respond({ 'crm resource restart vm1': 'ok' });
        const { ref } = renderActions(vmList[0]);

        await act(async () => {
            await ref.current.handleActionCrm('restart');
        });

        expect(cockpit.spawn).toHaveBeenCalledWith(
            ['crm', 'resource', 'restart', 'vm1'],
            { superuser: 'try' }
        );
    });

    it('logs an error and stops the spinner when the action fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({});
        const { ref } = renderActions(vmList[0]);

        await act(async () => {
            await ref.current.handleActionVmMgr('start');
        });

        expect(console.error).toHaveBeenCalled();
        expect(ref.current.state.isLoading).toBe(false);
    });

    it('does nothing when no VM is selected', async () => {
        const { ref, refreshVMList } = renderActions(null);

        await act(async () => {
            await ref.current.handleActionVmMgr('start');
        });

        expect(cockpit.spawn).not.toHaveBeenCalled();
        expect(refreshVMList).not.toHaveBeenCalled();
    });

    it('starts polling after a migration and stops on the Started status', async () => {
        respond({
            'crm_mon --output-as xml': '<crm_mon><resources><resource id="vm1" role="Started" /></resources></crm_mon>',
        });
        const { ref } = renderActions(vmList[0]);

        act(() => {
            ref.current.startPollingMigrationStatus();
        });
        expect(ref.current.pollingInterval).toBeDefined();
        // Clear the real interval so a slow machine cannot fire a stray tick.
        clearInterval(ref.current.pollingInterval);

        await act(async () => {
            await ref.current.checkMigrationStatus();
        });

        expect(cockpit.spawn).toHaveBeenCalledWith(['crm_mon', '--output-as', 'xml'], { superuser: 'try' });
        expect(ref.current.state.isLoading).toBe(false);
        expect(ref.current.state.isDisabled).toBe(false);
    });

    it('gives up polling after the maximum number of attempts', async () => {
        respond({
            'crm_mon --output-as xml': '<crm_mon><resources /></crm_mon>',
        });
        const { ref } = renderActions(vmList[0]);
        ref.current.maxPollingAttempts = 15;
        ref.current.pollingAttempts = 15;

        await act(async () => {
            await ref.current.checkMigrationStatus();
        });

        expect(ref.current.state.isLoading).toBe(false);
    });

    it('starts polling when a crm move is requested', async () => {
        respond({ 'crm resource move vm1 hyp2': 'ok' });
        const { ref } = renderActions(vmList[0]);

        await act(async () => {
            await ref.current.handleActionCrm('move', ['hyp2']);
        });

        expect(ref.current.pollingInterval).toBeDefined();
        clearInterval(ref.current.pollingInterval);
    });

    it('returns the snapshot list', async () => {
        respond({ 'vm-mgr list_snapshots -n vm1': "['s1', 's2']" });
        const { ref } = renderActions(vmList[0]);

        await expect(ref.current.getVMSnapshotList()).resolves.toEqual(['s1', 's2']);
    });

    it('returns an empty snapshot list on error', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({});
        const { ref } = renderActions(vmList[0]);

        await expect(ref.current.getVMSnapshotList()).resolves.toEqual([]);
    });

    it('returns the migratable nodes, excluding the current one', async () => {
        respond({
            'crm status --exclude=all --include=nodes': '* Online: [ hyp1 hyp2 hyp3 ]\n',
        });
        const { ref } = renderActions(vmList[0]);

        await expect(ref.current.getNodeList()).resolves.toEqual(['hyp2', 'hyp3']);
    });

    it('returns an empty node list on error', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({});
        const { ref } = renderActions(vmList[0]);

        await expect(ref.current.getNodeList()).resolves.toEqual([]);
    });

    it('opens and confirms the snapshot creation modal', () => {
        respond({ 'vm-mgr create_snapshot -n vm1 --snap_name snap1': 'ok' });
        const { ref } = renderActions(vmList[0]);

        act(() => ref.current.openVMSnapshot());
        expect(ref.current.state.isSnapshotCreatorOpen).toBe(true);

        act(() => ref.current.handleSnapshotConfirm('snap1'));
        expect(ref.current.state.isSnapshotCreatorOpen).toBe(false);
    });

    it('opens the snapshot-restore modal with the snapshot list', async () => {
        respond({ 'vm-mgr list_snapshots -n vm1': "['s1']" });
        const { ref } = renderActions(vmList[0]);

        await act(async () => {
            await ref.current.openVMSnapshotApply();
        });

        expect(ref.current.state.isSnapshotApplyOpen).toBe(true);
        expect(ref.current.state.snapshotList).toEqual(['s1']);
    });

    it('confirms the snapshot restore', async () => {
        respond({ 'vm-mgr rollback -n vm1 --snap_name s1': 'ok' });
        const { ref } = renderActions(vmList[0]);

        act(() => ref.current.handleSnapshotApplyConfirm('s1'));

        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledWith(
            ['vm-mgr', 'rollback', '-n', 'vm1', '--snap_name', 's1'],
            { superuser: 'try' }
        ));
    });

    it('opens the migration modal with the node list', async () => {
        respond({ 'crm status --exclude=all --include=nodes': '* Online: [ hyp1 hyp2 ]\n' });
        const { ref } = renderActions(vmList[0]);

        await act(async () => {
            await ref.current.openVMMigration();
        });

        expect(ref.current.state.isMigrationOpen).toBe(true);
        expect(ref.current.state.nodeList).toEqual(['hyp2']);
    });

    it('closes the modals', () => {
        const { ref } = renderActions(vmList[0]);

        act(() => ref.current.closeVMSnapshot());
        act(() => ref.current.closeVMSnapshotApply());
        act(() => ref.current.closeVMMigration());

        expect(ref.current.state.isSnapshotCreatorOpen).toBe(false);
        expect(ref.current.state.isSnapshotApplyOpen).toBe(false);
        expect(ref.current.state.isMigrationOpen).toBe(false);
    });

    it('opens the console for the selected VM', () => {
        const { ref } = renderActions(vmList[0]);

        act(() => ref.current.setState({ isDisabled: false }));
        fireEvent.click(screen.getByRole('button', { name: 'Virtual Machine Console' }));

        expect(cockpit.location.go).toHaveBeenCalledWith(['console', 'vm1']);
    });
});
