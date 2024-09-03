/*
 * Copyright (C) 2017-2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import VMManager from './components/VMManager';
import VMConsole from './components/VMConsole';
import cockpit from 'cockpit';

export class Application extends React.Component {
    constructor() {
        super();
        this.state = {
            path: cockpit.location.path,
        };
        this.onNavigate = () => this.setState({ path: cockpit.location.path });
    }

    componentDidMount() {
        cockpit.addEventListener("locationchanged", this.onNavigate);
    }

    componentWillUnmount() {
        cockpit.removeEventListener("locationchanged", this.onNavigate);
    }

    render() {
        const { path } = this.state;
        const vmName = path[1];

        if(path.length > 0 && path[0] === "console" && vmName){
            return(
                <div>
                    <VMConsole
                        key={vmName}
                        libvirtUser={"root"}
                        virtualMachineName={vmName}
                    />
                </div>
            );
        }else{
            return(
                <div>
                    <h1 className="title1">Cluster VM Management</h1>
                    <VMManager />
                </div>
            );
        }
    }
}
