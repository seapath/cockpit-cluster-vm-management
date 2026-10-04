/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render as rtlRender, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import VMData from '../../src/components/VMData.jsx';
import { respond } from '../helpers/spawn.js';

function latestVmList(renderProp) {
    const calls = renderProp.mock.calls;
    return calls.length ? calls[calls.length - 1][0] : undefined;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('VMData', () => {
    it('loads the VMs with their state, current and default node', async () => {
        respond({
            'vm-mgr list': 'vm1\nvm2\n',
            'vm-mgr status --name vm1': 'running',
            'vm-mgr status --name vm2': 'stopped',
            'crm resource locate vm1': 'resource vm1 is running on: hyp1\n',
            'crm resource locate vm2': 'resource vm2 is NOT running\n',
            'crm configure show': 'location pin-vm1-onhyp1 vm1 resource-discovery=exclusive inf: hyp1\n',
        });
        const renderProp = vi.fn(() => null);

        rtlRender(<VMData render={renderProp} />);

        await waitFor(() => {
            const list = latestVmList(renderProp);
            expect(list).toHaveLength(2);
            expect(list[0]).toMatchObject({
                name: 'vm1',
                state: 'running',
                currentNode: 'hyp1',
                defaultNode: 'pin: hyp1',
            });
            expect(list[1]).toMatchObject({
                name: 'vm2',
                state: 'stopped',
                currentNode: '-',
                defaultNode: '-',
            });
        });
    });

    it('reports an empty list when no VM is deployed', async () => {
        respond({
            'vm-mgr list': '\n',
            'crm configure show': '',
        });
        const renderProp = vi.fn(() => null);

        rtlRender(<VMData render={renderProp} />);

        await waitFor(() => {
            // The default-location fetch runs after the empty list, so waiting
            // for it proves the whole refresh chain completed.
            expect(cockpit.spawn).toHaveBeenCalledWith(['crm', 'configure', 'show'], { superuser: 'try' });
        });
        expect(latestVmList(renderProp)).toEqual([]);
        expect(cockpit.spawn).toHaveBeenCalledWith(['vm-mgr', 'list'], { superuser: 'try' });
    });

    it('logs an error when the VM list cannot be fetched', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({
            'crm configure show': '',
        });
        const renderProp = vi.fn(() => null);

        rtlRender(<VMData render={renderProp} />);

        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith(
                'Error retrieving the list of VMs:',
                expect.any(Error)
            );
        });
        expect(latestVmList(renderProp)).toEqual([]);
    });

    it('marks the state as Error when the status command fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({
            'vm-mgr list': 'vm1\n',
            'crm resource locate vm1': 'resource vm1 is running on: hyp1\n',
            'crm configure show': '',
        });
        const renderProp = vi.fn(() => null);

        rtlRender(<VMData render={renderProp} />);

        await waitFor(() => {
            const list = latestVmList(renderProp);
            expect(list[0]).toMatchObject({ name: 'vm1', state: 'Error' });
        });
    });

    it('marks the current node as Error when the locate command fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({
            'vm-mgr list': 'vm1\n',
            'vm-mgr status --name vm1': 'running',
            'crm configure show': '',
        });
        const renderProp = vi.fn(() => null);

        rtlRender(<VMData render={renderProp} />);

        await waitFor(() => {
            const list = latestVmList(renderProp);
            expect(list[0]).toMatchObject({ name: 'vm1', currentNode: 'Error' });
        });
    });

    it('logs an error when the default locations cannot be fetched', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({
            'vm-mgr list': '\n',
        });
        const renderProp = vi.fn(() => null);

        rtlRender(<VMData render={renderProp} />);

        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith(
                'Error retrieving default VM locations:',
                expect.any(Error)
            );
        });
    });
});
