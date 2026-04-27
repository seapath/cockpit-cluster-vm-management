/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextInput,
} from '@patternfly/react-core';

const INTERFACE_TYPES = [
  { value: 'bridge', label: 'Bridge' },
  { value: 'macvtap', label: 'MacvTap' },
  { value: 'pci', label: 'PCI passthrough' },
  { value: 'sriov', label: 'SR-IOV pool' },
];

const MACVTAP_MODES = ['vepa', 'bridge', 'private', 'passthrough'];

class NetworkConfig extends React.Component {
  renderBridgeFields(iface) {
    const { onInterfaceChange } = this.props;
    return (
      <>
        <FormGroup label="Bridge source" fieldId={`bridge-source-${iface.id}`}>
          <TextInput
            id={`bridge-source-${iface.id}`}
            value={iface.bridgeSource}
            onChange={(e) => onInterfaceChange(iface.id, 'bridgeSource', e.target.value)}
            placeholder="e.g. br0"
          />
        </FormGroup>
        <FormGroup label="MAC address" fieldId={`bridge-mac-${iface.id}`}>
          <TextInput
            id={`bridge-mac-${iface.id}`}
            value={iface.bridgeMac}
            onChange={(e) => onInterfaceChange(iface.id, 'bridgeMac', e.target.value)}
            placeholder="e.g. 52:54:00:xx:xx:xx"
          />
        </FormGroup>
        <FormGroup label="VLAN tag (optional)" fieldId={`bridge-vlan-${iface.id}`}>
          <TextInput
            id={`bridge-vlan-${iface.id}`}
            value={iface.bridgeVlan}
            onChange={(e) => onInterfaceChange(iface.id, 'bridgeVlan', e.target.value)}
            placeholder="e.g. 100"
          />
        </FormGroup>
        <FormGroup label="Virtualport type (optional)" fieldId={`bridge-vport-${iface.id}`}>
          <TextInput
            id={`bridge-vport-${iface.id}`}
            value={iface.bridgeVirtualportType}
            onChange={(e) => onInterfaceChange(iface.id, 'bridgeVirtualportType', e.target.value)}
            placeholder="e.g. openvswitch"
          />
        </FormGroup>
      </>
    );
  }

  renderMacvtapFields(iface) {
    const { onInterfaceChange } = this.props;
    return (
      <>
        <FormGroup label="Source device" fieldId={`macvtap-source-${iface.id}`}>
          <TextInput
            id={`macvtap-source-${iface.id}`}
            value={iface.macvtapSource}
            onChange={(e) => onInterfaceChange(iface.id, 'macvtapSource', e.target.value)}
            placeholder="e.g. eth0"
          />
        </FormGroup>
        <FormGroup label="Mode" fieldId={`macvtap-mode-${iface.id}`}>
          <FormSelect
            id={`macvtap-mode-${iface.id}`}
            value={iface.macvtapMode}
            onChange={(e, value) => onInterfaceChange(iface.id, 'macvtapMode', value)}
          >
            {MACVTAP_MODES.map((mode) => (
              <FormSelectOption key={mode} value={mode} label={mode} />
            ))}
          </FormSelect>
        </FormGroup>
        <FormGroup label="MAC address" fieldId={`macvtap-mac-${iface.id}`}>
          <TextInput
            id={`macvtap-mac-${iface.id}`}
            value={iface.macvtapMac}
            onChange={(e) => onInterfaceChange(iface.id, 'macvtapMac', e.target.value)}
            placeholder="e.g. 52:54:00:xx:xx:xx"
          />
        </FormGroup>
      </>
    );
  }

  renderPciFields(iface) {
    const { onInterfaceChange } = this.props;
    return (
      <FormGroup label="PCI address" fieldId={`pci-address-${iface.id}`}>
        <TextInput
          id={`pci-address-${iface.id}`}
          value={iface.pciAddress}
          onChange={(e) => onInterfaceChange(iface.id, 'pciAddress', e.target.value)}
          placeholder="e.g. 0000:03:00.0"
        />
      </FormGroup>
    );
  }

  renderSriovFields(iface) {
    const { onInterfaceChange } = this.props;
    return (
      <FormGroup label="SR-IOV pool name" fieldId={`sriov-pool-${iface.id}`}>
        <TextInput
          id={`sriov-pool-${iface.id}`}
          value={iface.sriovPool}
          onChange={(e) => onInterfaceChange(iface.id, 'sriovPool', e.target.value)}
          placeholder="e.g. sriov-net-pool"
        />
      </FormGroup>
    );
  }

  renderInterfaceFields(iface) {
    switch (iface.type) {
      case 'bridge': return this.renderBridgeFields(iface);
      case 'macvtap': return this.renderMacvtapFields(iface);
      case 'pci': return this.renderPciFields(iface);
      case 'sriov': return this.renderSriovFields(iface);
      default: return null;
    }
  }

  render() {
    const {
      networkInterfaces,
      onAddInterface,
      onRemoveInterface,
      onInterfaceChange,
    } = this.props;

    return (
      <>
        <FormGroup label="Network interfaces">
          <Button variant="secondary" onClick={onAddInterface}>
            Add network interface
          </Button>
        </FormGroup>

        {networkInterfaces.map((iface) => (
          <div key={iface.id} style={{ border: '1px solid var(--pf-v5-global--BorderColor--100)', padding: '16px', marginBottom: '16px', borderRadius: '4px' }}>
            <FormGroup label="Interface type" fieldId={`iface-type-${iface.id}`}>
              <FormSelect
                id={`iface-type-${iface.id}`}
                value={iface.type}
                onChange={(e, value) => onInterfaceChange(iface.id, 'type', value)}
              >
                {INTERFACE_TYPES.map((opt) => (
                  <FormSelectOption key={opt.value} value={opt.value} label={opt.label} />
                ))}
              </FormSelect>
            </FormGroup>

            {this.renderInterfaceFields(iface)}

            <Button variant="danger" onClick={() => onRemoveInterface(iface.id)} style={{ marginTop: '8px' }}>
              Remove
            </Button>
          </div>
        ))}
      </>
    );
  }
}

NetworkConfig.propTypes = {
  networkInterfaces: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddInterface: PropTypes.func.isRequired,
  onRemoveInterface: PropTypes.func.isRequired,
  onInterfaceChange: PropTypes.func.isRequired,
};

export default NetworkConfig;
