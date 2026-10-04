/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VMManager from '../../src/components/VMManager.jsx';
import { respond } from '../helpers/spawn.js';

// The vendored file autocomplete pulls PatternFly CSS that jsdom cannot load;
// it is not part of the behaviour under test here.
vi.mock('cockpit-components-file-autocomplete.jsx', () => ({
    FileAutoComplete: () => null,
}));

function renderManager() {
    const ref = React.createRef();
    render(<VMManager ref={ref} />);
    return { ref };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('VMManager', () => {
    it('renders the create and import buttons', () => {
        respond({ 'vm-mgr list': '\n', 'crm configure show': '' });
        renderManager();

        expect(screen.getByRole('button', { name: 'Create VM' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add local VM to cluster' })).toBeInTheDocument();
    });

    it('opens and closes the VM creator', () => {
        respond({ 'vm-mgr list': '\n', 'crm configure show': '' });
        const { ref } = renderManager();

        act(() => ref.current.openVMCreator());
        expect(ref.current.state.isVMCreatorOpen).toBe(true);

        act(() => ref.current.closeVMCreator());
        expect(ref.current.state.isVMCreatorOpen).toBe(false);
    });

    it('opens and closes the VM importer', () => {
        respond({ 'vm-mgr list': '\n', 'crm configure show': '' });
        const { ref } = renderManager();

        act(() => ref.current.openVMImporter());
        expect(ref.current.state.isVMImporterOpen).toBe(true);

        act(() => ref.current.closeVMImporter());
        expect(ref.current.state.isVMImporterOpen).toBe(false);
    });

    it('tracks the selected VM', () => {
        respond({ 'vm-mgr list': '\n', 'crm configure show': '' });
        const { ref } = renderManager();

        act(() => ref.current.updateSelectedVM({ name: 'vm1' }));
        expect(ref.current.state.selectedVM).toEqual({ name: 'vm1' });
    });

    it('opens the creator when the button is clicked', () => {
        respond({ 'vm-mgr list': '\n', 'crm configure show': '' });
        const { ref } = renderManager();

        fireEvent.click(screen.getByRole('button', { name: 'Create VM' }));

        expect(ref.current.state.isVMCreatorOpen).toBe(true);
    });
});
