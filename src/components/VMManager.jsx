/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import VMData from './VMData';
import VMTable from './VMTable';
import VMActions from './VMActions';

class VMManager extends React.Component {
  state = {
    selectedVM: null,
  };

  handleRowClick = (vm) => {
    this.setState({ selectedVM: vm });
  };

  render() {
    const { selectedVM } = this.state;

    return (
      <VMData render={(VMlist, refreshVMList) => (
        <div>
          <VMTable VMlist={VMlist} selectedVM={selectedVM} onRowClick={this.handleRowClick} />
          <VMActions selectedVM={selectedVM} refreshVMList={refreshVMList}/>
        </div>
      )} />
    );
  }
}

export default VMManager;
