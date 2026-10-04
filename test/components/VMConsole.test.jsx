/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import VMConsole from '../../src/components/VMConsole.jsx';
import { respond } from '../helpers/spawn.js';

// The terminal widget needs xterm and a canvas; it plays no part in the logic
// under test.
vi.mock('cockpit-components-terminal.jsx', () => ({
    Terminal: () => null,
}));

function renderConsole(props = {}) {
    const ref = React.createRef();
    render(
        <VMConsole ref={ref} libvirtUser="root" virtualMachineName="vm1" {...props} />
    );
    return { ref };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('VMConsole', () => {
    it('connects to the VM and lists the other VMs', async () => {
        respond({
            'crm resource locate vm1': 'resource vm1 is running on: hyp1\n',
            'vm-mgr list': 'vm1\nvm2\n',
        });
        const { ref } = renderConsole();

        await waitFor(() => expect(ref.current.state.channel).toBeDefined());

        expect(cockpit.channel).toHaveBeenCalledWith(expect.objectContaining({
            payload: 'stream',
            spawn: ['virsh', '--connect', 'qemu+ssh://root@hyp1/system', 'console', 'vm1'],
        }));
        expect(ref.current.state.VMNode).toBe('hyp1');
        expect(ref.current.state.availableVM).toEqual(['vm1', 'vm2']);
        expect(screen.getByRole('button', { name: 'vm1' })).toBeInTheDocument();
    });

    it('logs an error and reports no node when the locate command fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({ 'vm-mgr list': 'vm1\n' });
        const { ref } = renderConsole();

        await waitFor(() => expect(ref.current.state.channel).toBeDefined());

        expect(ref.current.state.VMNode).toBeNull();
        expect(console.error).toHaveBeenCalled();
    });

    it('logs an error and reports no VM list when the list command fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        respond({ 'crm resource locate vm1': 'resource vm1 is running on: hyp1\n' });
        const { ref } = renderConsole();

        await waitFor(() => expect(ref.current.state.channel).toBeDefined());

        expect(ref.current.state.availableVM).toEqual([]);
        expect(console.error).toHaveBeenCalled();
    });

    it('toggles the VM selector', () => {
        respond({ 'crm resource locate vm1': 'resource vm1 is running on: hyp1\n', 'vm-mgr list': 'vm1\n' });
        const { ref } = renderConsole();

        act(() => ref.current.handleSelectToggle());
        expect(ref.current.state.isSelectOpen).toBe(true);
    });

    it('switches to another VM through the selector', () => {
        respond({ 'crm resource locate vm1': 'resource vm1 is running on: hyp1\n', 'vm-mgr list': 'vm1\n' });
        const { ref } = renderConsole();

        act(() => ref.current.handleSelect(null, 'vm2'));

        expect(ref.current.state.VMName).toBe('vm2');
        expect(ref.current.state.isSelectOpen).toBe(false);
        expect(cockpit.location.go).toHaveBeenCalledWith(['console', 'vm2']);
    });

    it('updates the remote user and rebuilds the channel', async () => {
        respond({ 'crm resource locate vm1': 'resource vm1 is running on: hyp1\n', 'vm-mgr list': 'vm1\n' });
        const { ref } = renderConsole();
        await waitFor(() => expect(ref.current.state.channel).toBeDefined());
        const initialChannelCalls = cockpit.channel.mock.calls.length;

        fireEvent.change(screen.getByDisplayValue('root'), { target: { value: 'admin' } });
        expect(ref.current.state.tmpLibvirtUser).toBe('admin');

        act(() => ref.current.handleLibvirtUserUpdate());

        expect(ref.current.state.libvirtUser).toBe('admin');
        expect(cockpit.channel.mock.calls.length).toBe(initialChannelCalls + 1);
        expect(cockpit.channel.mock.calls.at(-1)[0].spawn[2]).toBe('qemu+ssh://admin@hyp1/system');
    });

    it('disconnects and leaves the console page', async () => {
        respond({ 'crm resource locate vm1': 'resource vm1 is running on: hyp1\n', 'vm-mgr list': 'vm1\n' });
        const { ref } = renderConsole();
        await waitFor(() => expect(ref.current.state.channel).toBeDefined());
        const channel = ref.current.state.channel;

        act(() => ref.current.onDisconnect());

        expect(channel.close).toHaveBeenCalled();
        expect(ref.current.state.channel).toBeNull();
        expect(cockpit.location.go).toHaveBeenCalledWith(['']);
    });

    it('disconnects gracefully without a channel', () => {
        respond({ 'crm resource locate vm1': 'resource vm1 is running on: hyp1\n', 'vm-mgr list': 'vm1\n' });
        const { ref } = renderConsole();
        act(() => ref.current.setState({ channel: null }));

        act(() => ref.current.onDisconnect());

        expect(cockpit.location.go).toHaveBeenCalledWith(['']);
    });
});
