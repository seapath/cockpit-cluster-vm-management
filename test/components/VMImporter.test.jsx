/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import VMImporter from '../../src/components/VMImporter.jsx';
import { respond, streamingSpawn } from '../helpers/spawn.js';

function renderImporter() {
    const refreshVMList = vi.fn();
    const onClose = vi.fn();
    const ref = React.createRef();
    render(<VMImporter ref={ref} isOpen onClose={onClose} refreshVMList={refreshVMList} />);
    return { ref, refreshVMList, onClose };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('VMImporter', () => {
    it('keeps only the local VMs that are not already in the cluster', async () => {
        respond({
            'virsh list --all --name': 'local1\nlocal2\nshared\n',
            'vm-mgr list': 'shared\n',
        });
        const { ref } = renderImporter();

        await act(async () => {
            await ref.current.fetchLocalVMs();
        });

        await waitFor(() => expect(ref.current.state.vmList).toEqual(['local1', 'local2']));
    });

    it('falls back to an empty list when the VM lists cannot be fetched', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({});
        const { ref } = renderImporter();

        await act(async () => {
            await ref.current.fetchLocalVMs();
        });

        expect(ref.current.state.vmList).toEqual([]);
    });

    it('imports the selected VM with live migration and a pinned host', async () => {
        cockpit.spawn.mockImplementation(() => streamingSpawn({ streams: ['importing\n'] }));
        const { ref, refreshVMList } = renderImporter();

        act(() => {
            ref.current.setState({
                selectedVM: 'local1',
                isPinnedHostEnabled: true,
                locationHostname: 'hyp1',
            });
        });
        act(() => ref.current.handleConfirm());

        await waitFor(() => expect(ref.current.state.isImported).toBe(true));

        expect(cockpit.spawn.mock.calls[0][0]).toEqual([
            'vm-mgr', 'add-to-cluster', '-p',
            '--name', 'local1',
            '--enable-live-migration', '--migration-user', 'libvirtadmin',
            '--pinned-host', 'hyp1',
        ]);
        expect(refreshVMList).toHaveBeenCalled();
        expect(ref.current.state.progressImport).toBe('importing');
    });

    it('imports with a preferred host and without live migration', async () => {
        cockpit.spawn.mockImplementation(() => streamingSpawn());
        const { ref } = renderImporter();

        act(() => {
            ref.current.setState({
                selectedVM: 'local2',
                isLiveMigrationEnabled: false,
                isPreferredHostEnabled: true,
                locationHostname: 'hyp2',
            });
        });
        act(() => ref.current.handleConfirm());

        await waitFor(() => expect(ref.current.state.isImported).toBe(true));

        expect(cockpit.spawn.mock.calls[0][0]).toEqual([
            'vm-mgr', 'add-to-cluster', '-p',
            '--name', 'local2',
            '--preferred-host', 'hyp2',
        ]);
    });

    it('reports a failure when the import command fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        cockpit.spawn.mockImplementation(() => streamingSpawn({ resolves: false }));
        const { ref } = renderImporter();

        act(() => ref.current.setState({ selectedVM: 'local1' }));
        act(() => ref.current.handleConfirm());

        await waitFor(() => expect(ref.current.state.isImported).toBe(false));
        expect(console.error).toHaveBeenCalled();
    });

    it('handles the dropdown and form controls', () => {
        const { ref } = renderImporter();

        act(() => ref.current.handleDropdownToggle());
        expect(ref.current.state.isDropdownOpen).toBe(true);

        act(() => ref.current.handleDropdownSelect('local1'));
        expect(ref.current.state.selectedVM).toBe('local1');
        expect(ref.current.state.isDropdownOpen).toBe(false);

        act(() => ref.current.handleCheckboxChange());
        expect(ref.current.state.isLiveMigrationEnabled).toBe(false);

        act(() => ref.current.handleLocationPreferenceChange({ target: { id: 'import-pinned-host' } }));
        expect(ref.current.state.isPinnedHostEnabled).toBe(true);

        act(() => ref.current.handleLocationPreferenceChange({ target: { id: 'import-preferred-host' } }));
        expect(ref.current.state.isPreferredHostEnabled).toBe(true);
        expect(ref.current.state.isPinnedHostEnabled).toBe(false);

        act(() => ref.current.handleLocationHostnameChange({ target: { value: 'hyp5' } }));
        expect(ref.current.state.locationHostname).toBe('hyp5');
    });

    it('shows a success or failure alert', () => {
        const { ref } = renderImporter();

        act(() => ref.current.setState({ isImported: true }));
        expect(screen.getByText('VM successfully imported!')).toBeInTheDocument();

        act(() => ref.current.setState({ isImported: false }));
        expect(screen.getByText('Failed to import VM.')).toBeInTheDocument();
    });

    it('reveals the hostname field when a location preference is chosen', () => {
        const { ref } = renderImporter();

        expect(screen.queryByLabelText('Hostname')).not.toBeInTheDocument();

        act(() => ref.current.setState({ isPreferredHostEnabled: true }));
        expect(screen.getByLabelText('Hostname')).toBeInTheDocument();
    });

    it('loads the local VMs when the modal is opened', async () => {
        respond({
            'virsh list --all --name': 'local1\n',
            'vm-mgr list': '',
        });
        const ref = React.createRef();
        const { rerender } = render(
            <VMImporter ref={ref} isOpen={false} onClose={() => {}} refreshVMList={() => {}} />
        );

        rerender(<VMImporter ref={ref} isOpen onClose={() => {}} refreshVMList={() => {}} />);

        await waitFor(() => expect(ref.current.state.vmList).toEqual(['local1']));
    });
});
