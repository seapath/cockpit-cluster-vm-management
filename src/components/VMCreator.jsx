import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextInput,
  ModalVariant,
  Alert,
  Progress,
  Checkbox,
  Radio,
} from '@patternfly/react-core';
import FileUploader from './fileUploader';
import { FileAutoComplete } from "cockpit-components-file-autocomplete.jsx";
import CPUConfig from './CPUConfig';
import MemoryConfig from './MemoryConfig';
import DisplayConfig from './DisplayConfig';
import NetworkConfig from './NetworkConfig';

class VMCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      vmName: '',
      vmImagePath: '',
      vmXmlPath: '',
      progressUploadXML: 0,
      progressUploadQCOW: 0,
      progressVMCreation: '',
      isVMCreated: null,
      diskBusType: 'virtio',
      isLiveMigrationEnabled: true,
      isPinnedHostEnabled: false,
      isPreferredHostEnabled: false,
      locationHostname: '',
      // New state for form-based creation
      importXml: false,
      isRealtime: false,
      vcpuCount: 1,
      hostPassthrough: false,
      cpuPinning: [''],
      rtPriority: 1,
      emulatorPin: '',
      memorySize: 2048,
      isBalloonEnabled: false,
      balloonMinAllocation: 1024,
      isHugepagesEnabled: false,
      hugepagesCount: 2,
      isSerialConsoleEnabled: true,
      isVideoEnabled: false,
      networkInterfaces: [],
      nextInterfaceId: 0,
    };
  }

  handleVmNameChange = (e) => {
    this.setState({ vmName: e.target.value });
  }

  handleVmImagePathChange = (vmImagePath) => {
    this.setState({ vmImagePath });
  }

  handleVmXmlPathChange = (vmXmlPath) => {
    this.setState({ vmXmlPath });
  }

  handleDiskBusTypeChange = (e, diskBusType) => {
    this.setState({ diskBusType });
  }

  handleLocationPreferenceChange = (e) => {
    const id = e.target.id;
    this.setState({
      isPinnedHostEnabled: id === 'pinned-host',
      isPreferredHostEnabled: id === 'preferred-host',
    });
  };
  handleLocationHostnameChange = (e) => {
    this.setState({ locationHostname: e.target.value });
  }

  handleImportXmlChange = () => {
    this.setState({ importXml: !this.state.importXml });
  }

  handleRealtimeChange = () => {
    const newRt = !this.state.isRealtime;
    const updates = { isRealtime: newRt };
    if (newRt) {
      updates.hostPassthrough = true;
      updates.isBalloonEnabled = false;
      updates.cpuPinning = Array.from({ length: this.state.vcpuCount }, () => '');
    }
    this.setState(updates);
  }

  handleVcpuCountChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value, 10) || 1);
    const updates = { vcpuCount: count };
    if (this.state.isRealtime) {
      const current = this.state.cpuPinning;
      updates.cpuPinning = Array.from({ length: count }, (_, i) => current[i] || '');
    }
    this.setState(updates);
  }

  handleHostPassthroughChange = () => {
    if (!this.state.isRealtime) {
      this.setState({ hostPassthrough: !this.state.hostPassthrough });
    }
  }

  handleCpuPinningChange = (index, value) => {
    const cpuPinning = [...this.state.cpuPinning];
    cpuPinning[index] = value;
    this.setState({ cpuPinning });
  }

  handleRtPriorityChange = (e) => {
    this.setState({ rtPriority: Math.max(1, parseInt(e.target.value, 10) || 1) });
  }

  handleEmulatorPinChange = (e) => {
    this.setState({ emulatorPin: e.target.value });
  }

  handleMemorySizeChange = (e) => {
    this.setState({ memorySize: Math.max(1, parseInt(e.target.value, 10) || 1) });
  }

  handleBalloonChange = () => {
    this.setState({ isBalloonEnabled: !this.state.isBalloonEnabled });
  }

  handleBalloonMinAllocationChange = (e) => {
    this.setState({ balloonMinAllocation: Math.max(1, parseInt(e.target.value, 10) || 1) });
  }

  handleHugepagesChange = () => {
    this.setState({ isHugepagesEnabled: !this.state.isHugepagesEnabled });
  }

  handleHugepagesCountChange = (e) => {
    this.setState({ hugepagesCount: Math.max(1, parseInt(e.target.value, 10) || 1) });
  }

  handleSerialConsoleChange = () => {
    this.setState({ isSerialConsoleEnabled: !this.state.isSerialConsoleEnabled });
  }

  handleVideoChange = () => {
    this.setState({ isVideoEnabled: !this.state.isVideoEnabled });
  }

  handleAddInterface = () => {
    const newIface = {
      id: this.state.nextInterfaceId,
      type: 'bridge',
      bridgeSource: '',
      bridgeMac: '',
      bridgeVlan: '',
      bridgeVirtualportType: '',
      networkName: '',
      macvtapSource: '',
      macvtapMode: 'vepa',
      macvtapMac: '',
      pciAddress: '',
      sriovPool: '',
    };
    this.setState({
      networkInterfaces: [...this.state.networkInterfaces, newIface],
      nextInterfaceId: this.state.nextInterfaceId + 1,
    });
  }

  handleRemoveInterface = (id) => {
    this.setState({
      networkInterfaces: this.state.networkInterfaces.filter((iface) => iface.id !== id),
    });
  }

  handleInterfaceChange = (id, field, value) => {
    this.setState({
      networkInterfaces: this.state.networkInterfaces.map((iface) =>
        iface.id === id ? { ...iface, [field]: value } : iface
      ),
    });
  }

  handleConfirm = () => {
    const { vmName, vmImagePath, vmXmlPath, diskBusType, importXml } = this.state;
    const { refreshVMList } = this.props;

    const args = [];
    if (this.state.isLiveMigrationEnabled) {
      args.push('--enable-live-migration');
      args.push('--migration-user');
      args.push('libvirtadmin');
    }

    if (this.state.isPinnedHostEnabled){
      args.push('--pinned-host');
      args.push(this.state.locationHostname);
    }else if (this.state.isPreferredHostEnabled){
      args.push('--preferred-host');
      args.push(this.state.locationHostname);
    }

    if (!importXml) {
      // Form-based creation not yet implemented
      console.warn("Form-based XML generation is not yet implemented");
      return;
    }

    this.setState({ isLoading: true, isVMCreated: null });
    cockpit.spawn(["vm-mgr", "create", "-p", "--name", vmName, "--image", vmImagePath, "--xml", vmXmlPath, "--disk-bus", diskBusType, ...args], { superuser: "try" })
      .stream((output) => {
        this.setState({ progressVMCreation: output.trim() });
      })
      .then(() => {
        this.setState({ isVMCreated: true });
        refreshVMList();
      })
      .catch(error => {
        this.setState({ isVMCreated: false });
        console.error("Error VM creation:", error);
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  // Handle data received from the child component FileUploader
  handleCallback = (filePath, fileType, progress) => {
    if (fileType === '.xml') {
      this.setState({ progressUploadXML: progress });
    } else if (fileType === '.qcow2') {
      this.setState({ progressUploadQCOW: progress });
    }

    if ( progress === 100) {
      if (fileType === '.xml') {
        this.setState({ vmXmlPath: filePath });
      } else if (fileType === '.qcow2') {
        this.setState({ vmImagePath: filePath });
      }
    }
  }

  handleCheckboxChange = () => {
    this.setState({ isLiveMigrationEnabled: !this.state.isLiveMigrationEnabled });
  }

  render() {
    const { isOpen, onClose } = this.props;
    const { vmName, vmImagePath, vmXmlPath, isLoading, isVMCreated, progressUploadXML, progressUploadQCOW, importXml } = this.state;
    const diskBusTypes = [ "sata", "scsi", "usb", "virtio" ];

    return (
      <Modal
        title="VM Creation"
        variant={importXml ? ModalVariant.small : ModalVariant.medium}
        isOpen={isOpen}
        onClose={onClose}
        actions={[
          <Button key="applyButton" variant="primary" onClick={this.handleConfirm}>
            Apply
          </Button>,
          <Button key="cancelButton" variant="link" onClick={onClose}>
            Cancel
          </Button>,
        ]}
      >

        {isVMCreated !== null && (
          <Alert
            variant={isVMCreated ? 'success' : 'danger'}
            title={isVMCreated ? 'VM successfully created!' : 'Failed to create VM.'}
            style={{ marginTop: '20px' }}
          />
        )}

        <Form>

          <FormGroup label="VM Name" fieldId="vm-name">
            <TextInput
              id="vm-name"
              value={vmName}
              onChange={this.handleVmNameChange}
            />
          </FormGroup>

          <FormGroup label="Path VM Image" fieldId="path-vm-image">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <FileAutoComplete
                id="path-vm-image"
                key={vmImagePath} // Force the update: the modification of "vmImagePath" by "handleCallback" do not change the value displayed
                placeholder={"Path to QCOW2 file on host's file system"}
                value={vmImagePath}
                onChange={this.handleVmImagePathChange}
                superuser="try"
              />
              <FileUploader
                fileExtension=".qcow2"
                handleCallback={(filePath, fileExtension, progress) => this.handleCallback(filePath, fileExtension, progress)}
              />
            </div>
            {progressUploadQCOW > 0 && (
              <Progress value={progressUploadQCOW} />
            )}
          </FormGroup>

          <FormGroup label="VM disk bus" fieldId="vm-disk-bus">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <FormSelect id="vm-disk-bus-selector" value={this.state.diskBusType} onChange={this.handleDiskBusTypeChange}>
                {diskBusTypes.map((option, index) =>
                  <FormSelectOption label={option} key={index} value={option} />
                )}
              </FormSelect>
            </div>
          </FormGroup>

          <Checkbox
            id="import-xml"
            label="Import libvirt XML"
            isChecked={importXml}
            onChange={this.handleImportXmlChange}
          />

          {importXml ? (
            <FormGroup label="Path VM XML" fieldId="path-vm-xml">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <FileAutoComplete
                  id="path-vm-xml"
                  key={vmXmlPath} // Force the update: the modification of "vmXmlPath" by "handleCallback" do not change the value displayed
                  placeholder={"Path to XML file on host's file system"}
                  value={vmXmlPath}
                  onChange={this.handleVmXmlPathChange}
                  superuser="try"
                />
                <FileUploader
                  fileExtension=".xml"
                  handleCallback={(filePath, fileExtension, progress) => this.handleCallback(filePath, fileExtension, progress)}
                />
              </div>
              {progressUploadXML > 0 && (
                <Progress value={progressUploadXML} />
              )}
            </FormGroup>
          ) : (
            <>
              <Checkbox
                id="enable-realtime"
                label="Real-time"
                isChecked={this.state.isRealtime}
                onChange={this.handleRealtimeChange}
              />

              <CPUConfig
                vcpuCount={this.state.vcpuCount}
                hostPassthrough={this.state.hostPassthrough}
                isRealtime={this.state.isRealtime}
                cpuPinning={this.state.cpuPinning}
                rtPriority={this.state.rtPriority}
                emulatorPin={this.state.emulatorPin}
                onVcpuCountChange={this.handleVcpuCountChange}
                onHostPassthroughChange={this.handleHostPassthroughChange}
                onCpuPinningChange={this.handleCpuPinningChange}
                onRtPriorityChange={this.handleRtPriorityChange}
                onEmulatorPinChange={this.handleEmulatorPinChange}
              />

              <MemoryConfig
                memorySize={this.state.memorySize}
                isRealtime={this.state.isRealtime}
                isBalloonEnabled={this.state.isBalloonEnabled}
                balloonMinAllocation={this.state.balloonMinAllocation}
                isHugepagesEnabled={this.state.isHugepagesEnabled}
                hugepagesCount={this.state.hugepagesCount}
                onMemorySizeChange={this.handleMemorySizeChange}
                onBalloonChange={this.handleBalloonChange}
                onBalloonMinAllocationChange={this.handleBalloonMinAllocationChange}
                onHugepagesChange={this.handleHugepagesChange}
                onHugepagesCountChange={this.handleHugepagesCountChange}
              />

              <DisplayConfig
                isSerialConsoleEnabled={this.state.isSerialConsoleEnabled}
                isVideoEnabled={this.state.isVideoEnabled}
                onSerialConsoleChange={this.handleSerialConsoleChange}
                onVideoChange={this.handleVideoChange}
              />

              <NetworkConfig
                networkInterfaces={this.state.networkInterfaces}
                onAddInterface={this.handleAddInterface}
                onRemoveInterface={this.handleRemoveInterface}
                onInterfaceChange={this.handleInterfaceChange}
              />
            </>
          )}

          <Checkbox
            id="enable-live-migration"
            label="Enable live migration"
            isChecked={this.state.isLiveMigrationEnabled}
            onChange={this.handleCheckboxChange}
          />
        <FormGroup role="radiogroup" label="Location preference" isInline>
          <Radio
            label="None"
            id="none"
            onChange={this.handleLocationPreferenceChange}
            isChecked={!this.state.isPinnedHostEnabled && !this.state.isPreferredHostEnabled}
          />
          <Radio
            label="Preferred host"
            id="preferred-host"
            onChange={this.handleLocationPreferenceChange}
            isChecked={this.state.isPreferredHostEnabled}
          />
          <Radio
            label="Pinned host"
            id="pinned-host"
            onChange={this.handleLocationPreferenceChange}
            isChecked={this.state.isPinnedHostEnabled}
          />
        </FormGroup>
        {(this.state.isPinnedHostEnabled || this.state.isPreferredHostEnabled) && (
          <FormGroup label="Hostname" fieldId="hostname">
            <TextInput
              id="hostname"
              value={this.state.locationHostname}
              onChange={this.handleLocationHostnameChange}
            />
          </FormGroup>
        )}


        </Form>
        <br />
        {isLoading && <div style={{textAlign: "center"}}> {this.state.progressVMCreation} </div>}
      </Modal>
    );
  }
}

VMCreator.propTypes = {
  refreshVMList: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default VMCreator;
