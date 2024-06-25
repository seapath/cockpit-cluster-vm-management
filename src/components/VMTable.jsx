/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';

class VMTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight,
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.setState({ windowHeight: window.innerHeight });
  };

  render() {
    const { VMlist, selectedVM, onRowClick } = this.props;
    const maxHeight = this.state.windowHeight * 0.4;

    return (
      <div style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}>
       <Table isStickyHeader>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>State</Th>
            <Th>Default Node</Th>
            <Th>Current Node</Th>
          </Tr>
        </Thead>
        <Tbody id="vm-table">
          {VMlist.map((vm) => (
            <Tr
              id={vm.name}
              key={vm.id}
              onClick={() => onRowClick(vm)}
              style={{ backgroundColor: selectedVM && selectedVM.id === vm.id ? '#0066CC' : '' }}
            >
              <Td>{vm.name}</Td>
              <Td>{vm.state}</Td>
              <Td>{vm.defaultNode}</Td>
              <Td>{vm.currentNode}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      </div>
    );
  }
}

export default VMTable;
