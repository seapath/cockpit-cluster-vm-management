/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import VMCreator from '../../src/components/VMCreator.jsx';
import { streamingSpawn } from '../helpers/spawn.js';

// The real component pulls cockpit's file autocomplete (and its xterm-like
// dependencies); a stub keeps the test focused on VMCreator's own logic.
vi.mock('cockpit-components-file-autocomplete.jsx', () => ({
    FileAutoComplete: () => null,
}));

function renderCreator() {
    const refreshVMList = vi.fn();
    const onClose = vi.fn();
    const ref = React.createRef();
    render(
        <VMCreator ref={ref} isOpen onClose={onClose} refreshVMList={refreshVMList} />
    );
    return { ref, refreshVMList, onClose };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('VMCreator', () => {
    it('creates a VM with live migration and a pinned host', async () => {
        cockpit.spawn.mockImplementation(() => streamingSpawn({ streams: ['progress 50\n', 'done\n'] }));
        const { ref, refreshVMList } = renderCreator();

        act(() => {
            ref.current.setState({
                vmName: 'vm1',
                vmImagePath: '/images/vm1.qcow2',
                vmXmlPath: '/images/vm1.xml',
                diskBusType: 'scsi',
                isPinnedHostEnabled: true,
                locationHostname: 'hyp1',
            });
        });
        act(() => ref.current.handleConfirm());

        await waitFor(() => expect(ref.current.state.isVMCreated).toBe(true));

        const [command, options] = cockpit.spawn.mock.calls[0];
        expect(command).toEqual([
            'vm-mgr', 'create', '-p',
            '--name', 'vm1',
            '--image', '/images/vm1.qcow2',
            '--xml', '/images/vm1.xml',
            '--disk-bus', 'scsi',
            '--enable-live-migration', '--migration-user', 'libvirtadmin',
            '--pinned-host', 'hyp1',
        ]);
        expect(options).toEqual({ superuser: 'try' });
        expect(refreshVMList).toHaveBeenCalled();
        expect(ref.current.state.progressVMCreation).toBe('done');
        expect(ref.current.state.isLoading).toBe(false);
    });

    it('creates a VM with a preferred host and without live migration', async () => {
        cockpit.spawn.mockImplementation(() => streamingSpawn());
        const { ref } = renderCreator();

        act(() => {
            ref.current.setState({
                vmName: 'vm2',
                isLiveMigrationEnabled: false,
                isPreferredHostEnabled: true,
                locationHostname: 'hyp2',
            });
        });
        act(() => ref.current.handleConfirm());

        await waitFor(() => expect(ref.current.state.isVMCreated).toBe(true));

        expect(cockpit.spawn.mock.calls[0][0]).toEqual([
            'vm-mgr', 'create', '-p',
            '--name', 'vm2',
            '--image', '',
            '--xml', '',
            '--disk-bus', 'virtio',
            '--preferred-host', 'hyp2',
        ]);
    });

    it('reports a failure when the creation command fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        cockpit.spawn.mockImplementation(() => streamingSpawn({ resolves: false }));
        const { ref } = renderCreator();

        act(() => ref.current.handleConfirm());

        await waitFor(() => expect(ref.current.state.isVMCreated).toBe(false));
        expect(console.error).toHaveBeenCalled();
    });

    it('stores uploaded files once their transfer is complete', () => {
        const { ref } = renderCreator();

        act(() => ref.current.handleCallback('/uploads/vm1.xml', '.xml', 50));
        expect(ref.current.state.progressUploadXML).toBe(50);
        expect(ref.current.state.vmXmlPath).toBe('');

        act(() => ref.current.handleCallback('/uploads/vm1.xml', '.xml', 100));
        expect(ref.current.state.vmXmlPath).toBe('/uploads/vm1.xml');

        act(() => ref.current.handleCallback('/uploads/vm1.qcow2', '.qcow2', 100));
        expect(ref.current.state.vmImagePath).toBe('/uploads/vm1.qcow2');
    });

    it('updates the form fields', () => {
        const { ref } = renderCreator();

        act(() => ref.current.handleVmNameChange({ target: { value: 'vm3' } }));
        act(() => ref.current.handleVmImagePathChange('/img'));
        act(() => ref.current.handleVmXmlPathChange('/xml'));
        act(() => ref.current.handleDiskBusTypeChange(null, 'usb'));
        act(() => ref.current.handleLocationHostnameChange({ target: { value: 'hyp9' } }));

        expect(ref.current.state).toMatchObject({
            vmName: 'vm3',
            vmImagePath: '/img',
            vmXmlPath: '/xml',
            diskBusType: 'usb',
            locationHostname: 'hyp9',
        });
    });

    it('switches the location preference and live migration', () => {
        const { ref } = renderCreator();

        act(() => ref.current.handleLocationPreferenceChange({ target: { id: 'pinned-host' } }));
        expect(ref.current.state.isPinnedHostEnabled).toBe(true);
        expect(ref.current.state.isPreferredHostEnabled).toBe(false);

        act(() => ref.current.handleLocationPreferenceChange({ target: { id: 'preferred-host' } }));
        expect(ref.current.state.isPinnedHostEnabled).toBe(false);
        expect(ref.current.state.isPreferredHostEnabled).toBe(true);

        act(() => ref.current.handleLocationPreferenceChange({ target: { id: 'none' } }));
        expect(ref.current.state.isPinnedHostEnabled).toBe(false);
        expect(ref.current.state.isPreferredHostEnabled).toBe(false);

        act(() => ref.current.handleCheckboxChange());
        expect(ref.current.state.isLiveMigrationEnabled).toBe(false);
    });

    it('shows a success or failure alert', () => {
        const { ref } = renderCreator();

        act(() => ref.current.setState({ isVMCreated: true }));
        expect(screen.getByText('VM successfully created!')).toBeInTheDocument();

        act(() => ref.current.setState({ isVMCreated: false }));
        expect(screen.getByText('Failed to create VM.')).toBeInTheDocument();
    });

    it('reveals the hostname field when a location preference is chosen', () => {
        const { ref } = renderCreator();

        expect(screen.queryByLabelText('Hostname')).not.toBeInTheDocument();

        act(() => ref.current.setState({ isPinnedHostEnabled: true }));
        expect(screen.getByLabelText('Hostname')).toBeInTheDocument();
    });

    it('closes through the cancel button', () => {
        const { onClose } = renderCreator();

        screen.getByRole('button', { name: 'Cancel' });
        act(() => onClose());
        expect(onClose).toHaveBeenCalled();
    });
});
