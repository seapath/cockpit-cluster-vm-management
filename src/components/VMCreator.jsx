import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  Form,
  FormGroup,
  TextInput,
  ModalVariant,
  Alert,
  Progress,
  Checkbox,
  Radio,
} from '@patternfly/react-core';
import FileUploader from './fileUploader';
import { FileAutoComplete } from "cockpit-components-file-autocomplete.jsx";

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
      isLiveMigrationEnabled: false,
      migrationUser: '',
      isPinnedHostEnabled: false,
      isPreferredHostEnabled: false,
      locationHostname: ''
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

  handleMigrationUserChange = (e) => {
    this.setState({ migrationUser: e.target.value });
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

  handleConfirm = () => {
    const { vmName, vmImagePath, vmXmlPath } = this.state;
    const { refreshVMList } = this.props;

    const args = [];
    if (this.state.isLiveMigrationEnabled) {
      args.push('--enable-live-migration');
      args.push('--migration-user');
      args.push(this.state.migrationUser);
    }

    if (this.state.isPinnedHostEnabled){
      args.push('--pinned-host');
      args.push(this.state.locationHostname);
    }else if (this.state.isPreferredHostEnabled){
      args.push('--preferred-host');
      args.push(this.state.locationHostname);
    }

    this.setState({ isLoading: true, isVMCreated: null });
    cockpit.spawn(["vm-mgr", "create", "-p", "--name", vmName, "--image", vmImagePath, "--xml", vmXmlPath, ...args], { superuser: "try" })
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
    const { vmName, vmImagePath, vmXmlPath, isLoading, isVMCreated, progressUploadXML, progressUploadQCOW } = this.state;

    return (
      <Modal
        title="VM Creation"
        variant={ModalVariant.small}
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

          <Checkbox
            id="enable-live-migration"
            label="Enable live migration"
            isChecked={this.state.isLiveMigrationEnabled}
            onChange={this.handleCheckboxChange}
          />
          {this.state.isLiveMigrationEnabled && (
            <FormGroup label="Migration User" fieldId="migration-user">
              <TextInput
                id="migration-user"
                value={this.state.migrationUser}
                onChange={this.handleMigrationUserChange}
              />
            </FormGroup>
          )}

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
