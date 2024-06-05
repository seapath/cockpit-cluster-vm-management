/*
 * Copyright (C) 2017-2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import VMManager from './components/VMManager';

export class Application extends React.Component {
  render() {
    return (
      <div>
        <h1 className="title1">Cluster VM Management</h1>
        <VMManager />
      </div>
    );
  }
}
