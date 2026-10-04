/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VMSnapshot from '../../src/components/VMSnapshot.jsx';

describe('VMSnapshot', () => {
    it('confirms with the typed snapshot name', () => {
        const onConfirm = vi.fn();
        render(<VMSnapshot isOpen onConfirm={onConfirm} onCancel={() => {}} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'before-upgrade' } });
        fireEvent.click(screen.getByText('Confirm'));

        expect(onConfirm).toHaveBeenCalledWith('before-upgrade');
    });

    it('cancels and clears the field', () => {
        const onCancel = vi.fn();
        render(<VMSnapshot isOpen onConfirm={() => {}} onCancel={onCancel} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'snap' } });
        fireEvent.click(screen.getByText('Cancel'));

        expect(onCancel).toHaveBeenCalled();
        expect(screen.getByRole('textbox')).toHaveValue('');
    });
});
