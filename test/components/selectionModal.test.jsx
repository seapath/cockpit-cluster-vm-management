/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SelectionModal from '../../src/components/selectionModal.jsx';

function renderModal(props = {}) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const ref = React.createRef();
    render(
        <SelectionModal
            ref={ref}
            title="Pick an option"
            isOpen
            options={['hyp1', 'hyp2']}
            onConfirm={onConfirm}
            onCancel={onCancel}
            {...props}
        />
    );
    return { ref, onConfirm, onCancel };
}

describe('SelectionModal', () => {
    it('renders the title and the available options', () => {
        renderModal();

        expect(screen.getByText('Pick an option')).toBeInTheDocument();
        expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('confirms the selected option and resets the selection', () => {
        const { ref, onConfirm } = renderModal();

        act(() => ref.current.handleDropdownSelect('hyp1'));
        act(() => ref.current.handleConfirm());

        expect(onConfirm).toHaveBeenCalledWith('hyp1');
        expect(ref.current.state.selectedItem).toBe('');
    });

    it('cancels and resets the state', () => {
        const { ref, onCancel } = renderModal();

        act(() => ref.current.handleDropdownSelect('hyp2'));
        act(() => ref.current.handleCancel());

        expect(onCancel).toHaveBeenCalled();
        expect(ref.current.state.selectedItem).toBe('');
        expect(ref.current.state.isDropdownOpen).toBe(false);
    });

    it('toggles the dropdown', () => {
        const { ref } = renderModal();

        act(() => ref.current.handleDropdownToggle());
        expect(ref.current.state.isDropdownOpen).toBe(true);

        act(() => ref.current.handleDropdownToggle());
        expect(ref.current.state.isDropdownOpen).toBe(false);
    });

    it('opens the dropdown through the toggle button', () => {
        renderModal();

        fireEvent.click(screen.getByText('Select an option'));

        expect(screen.getByText('hyp1')).toBeInTheDocument();
    });
});
