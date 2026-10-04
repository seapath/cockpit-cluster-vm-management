/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import VMTable from '../../src/components/VMTable.jsx';

const vmList = [
    { id: 1, name: 'vm1', state: 'running', defaultNode: 'prefer: hyp1', currentNode: 'hyp1' },
    { id: 2, name: 'vm2', state: 'stopped', defaultNode: '-', currentNode: '-' },
];

describe('VMTable', () => {
    it('renders the VM rows', () => {
        render(<VMTable VMlist={vmList} selectedVM={null} onRowClick={() => {}} />);

        expect(screen.getByText('vm1')).toBeInTheDocument();
        expect(screen.getByText('running')).toBeInTheDocument();
        expect(screen.getByText('prefer: hyp1')).toBeInTheDocument();
        expect(screen.getByText('vm2')).toBeInTheDocument();
    });

    it('notifies the parent when a row is clicked', () => {
        const onRowClick = vi.fn();
        render(<VMTable VMlist={vmList} selectedVM={null} onRowClick={onRowClick} />);

        fireEvent.click(screen.getByText('vm1'));

        expect(onRowClick).toHaveBeenCalledWith(vmList[0]);
    });

    it('highlights the selected row', () => {
        render(<VMTable VMlist={vmList} selectedVM={vmList[0]} onRowClick={() => {}} />);

        expect(screen.getByText('vm1').closest('tr')).toHaveStyle({ backgroundColor: '#0066CC' });
        expect(screen.getByText('vm2').closest('tr')).not.toHaveStyle({ backgroundColor: '#0066CC' });
    });

    it('recomputes the maximum height on window resize', () => {
        window.innerHeight = 400;
        const { container } = render(
            <VMTable VMlist={vmList} selectedVM={null} onRowClick={() => {}} />
        );
        const wrapper = container.firstChild;

        expect(wrapper).toHaveStyle({ maxHeight: '160px' });

        window.innerHeight = 500;
        fireEvent(window, new Event('resize'));

        expect(wrapper).toHaveStyle({ maxHeight: '200px' });
    });
});
