/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';

class VMTable extends React.Component {
  render() {
    const { VMlist, selectedVM, onRowClick } = this.props;

    return (
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>State</Th>
            <Th>Default Node</Th>
            <Th>Current Node</Th>
          </Tr>
        </Thead>
        <Tbody>
          {VMlist.map((vm) => (
            <Tr
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
    );
  }
}

export default VMTable;
