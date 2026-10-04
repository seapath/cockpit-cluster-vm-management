/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import { Application } from '../../src/app.jsx';

// The routed views have their own tests; here we only check the routing.
vi.mock('../../src/components/VMConsole.jsx', async () => {
    const React = await import('react');
    return { default: () => React.createElement('div', null, 'console-view') };
});
vi.mock('../../src/components/VMManager.jsx', async () => {
    const React = await import('react');
    return { default: () => React.createElement('div', null, 'manager-view') };
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Application', () => {
    it('shows the VM manager by default', () => {
        cockpit.location.path = [];

        render(<Application />);

        expect(screen.getByText('manager-view')).toBeInTheDocument();
        expect(screen.getByText('Cluster VM Management')).toBeInTheDocument();
        expect(cockpit.addEventListener).toHaveBeenCalledWith('locationchanged', expect.any(Function));
    });

    it('shows the console when the location targets a VM', () => {
        cockpit.location.path = ['console', 'vm1'];

        render(<Application />);

        expect(screen.getByText('console-view')).toBeInTheDocument();
    });

    it('falls back to the manager when the console path has no VM name', () => {
        cockpit.location.path = ['console'];

        render(<Application />);

        expect(screen.getByText('manager-view')).toBeInTheDocument();
    });

    it('re-routes when the location changes', () => {
        cockpit.location.path = [];
        render(<Application />);
        const onNavigate = cockpit.addEventListener.mock.calls[0][1];

        cockpit.location.path = ['console', 'vm2'];
        act(() => onNavigate());

        expect(screen.getByText('console-view')).toBeInTheDocument();
    });

    it('unregisters the location listener on unmount', () => {
        cockpit.location.path = [];
        const { unmount } = render(<Application />);
        const onNavigate = cockpit.addEventListener.mock.calls[0][1];

        unmount();

        expect(cockpit.removeEventListener).toHaveBeenCalledWith('locationchanged', onNavigate);
    });
});
