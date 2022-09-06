/*
Copyright (C) 2022  Cloudbase Solutions SRL
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React from "react";
import { observer } from "mobx-react";
import styled from "styled-components";

import type { Field as FieldType } from "@src/@types/Field";
import Button from "@src/components/ui/Button";
import Modal from "@src/components/ui/Modal";
import FieldInput from "@src/components/ui/FieldInput";

import KeyboardManager from "@src/utils/KeyboardManager";
import { ThemeProps } from "@src/components/Theme";
import LoadingButton from "@src/components/ui/LoadingButton";
import { MetalHubServer } from "@src/@types/MetalHub";
import image from "./images/server.svg";

const Wrapper = styled.div`
  padding: 48px 32px 32px 32px;
`;
const Image = styled.div`
  width: 96px;
  height: 96px;
  background: url("${image}") center no-repeat;
  margin: 0 auto;
`;
const Form = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: 64px;

  > div {
    margin-top: 16px;
  }
`;
const Buttons = styled.div`
  margin-top: 32px;
  display: flex;
  justify-content: space-between;
`;

type Props = {
  loading: boolean;
  onRequestClose: () => void;
} & (
  | {
      server: MetalHubServer;
      onEditClick: (apiEndpoint: string) => void;
    }
  | {
      server?: undefined;
      onAddClick: (apiEndpoint: string) => void;
    }
);

type State = {
  host: string;
  port: string;
  highlightFieldNames: string[];
};
@observer
class MetalHubModal extends React.Component<Props, State> {
  state: State = {
    host: "",
    port: "",
    highlightFieldNames: [],
  };

  componentDidMount() {
    KeyboardManager.onEnter(
      "MetalHubNewModal",
      () => {
        this.handleAddClick();
      },
      2
    );

    if (this.props.server) {
      const apiEndpointComponents = this.props.server.api_endpoint.split(":");
      this.setState({
        host: apiEndpointComponents[1].replace("//", ""),
        port: apiEndpointComponents[2].replace(/\/.*/, ""),
      });
    }
  }

  componentWillUnmount() {
    KeyboardManager.removeKeyDown("MetalHubNewModal");
  }

  handleAddClick() {
    if (this.highlightFields()) {
      return;
    }

    const endpointUrl = `https://${this.state.host}:${this.state.port}/api/v1`;
    if (this.props.server) {
      this.props.onEditClick(endpointUrl);
    } else {
      this.props.onAddClick(endpointUrl);
    }
  }

  highlightFields() {
    const highlightFieldNames = [];
    if (!this.state.host) {
      highlightFieldNames.push("host");
    }
    if (!this.state.port) {
      highlightFieldNames.push("port");
    }
    if (highlightFieldNames.length > 0) {
      this.setState({ highlightFieldNames });
      return true;
    }
    this.setState({ highlightFieldNames: [] });
    return false;
  }

  renderField(opts: {
    field: FieldType;
    value: any;
    onChange: (value: any) => void;
  }) {
    const { field, value, onChange } = opts;
    return (
      <FieldInput
        layout="modal"
        key={field.name}
        name={field.name}
        type={field.type || "string"}
        value={value}
        label={field.label}
        description={field.description}
        onChange={onChange}
        width={ThemeProps.inputSizes.large.width}
        required={field.required}
        highlight={Boolean(
          this.state.highlightFieldNames.find(n => n === field.name)
        )}
        disabledLoading={this.props.loading}
      />
    );
  }

  renderForm() {
    const fields = [
      this.renderField({
        field: {
          name: "host",
          required: true,
          label: "Host",
          description:
            "The Coriolis Snapshot Agent API hostname of the added bare metal server",
        },
        value: this.state.host,
        onChange: host => {
          this.setState({ host });
        },
      }),
      this.renderField({
        field: {
          name: "port",
          required: true,
          label: "Port",
          description:
            "The port number used for accessing the Coriolis Snapshot Agent API of the added bare metal server",
        },
        value: this.state.port,
        onChange: port => {
          this.setState({ port });
        },
      }),
    ];

    return <Form>{fields}</Form>;
  }

  renderButtons() {
    return (
      <Buttons>
        <Button secondary large onClick={this.props.onRequestClose}>
          Cancel
        </Button>
        {this.props.loading ? (
          <LoadingButton large>
            {this.props.server ? "Updating ..." : "Adding ..."}
          </LoadingButton>
        ) : (
          <Button
            large
            onClick={() => {
              this.handleAddClick();
            }}
          >
            {this.props.server ? "Update" : "Add"}
          </Button>
        )}
      </Buttons>
    );
  }

  render() {
    return (
      <Modal
        isOpen
        title={`${
          this.props.server ? "Update" : "Add"
        } Coriolis Bare Metal Server`}
        onRequestClose={this.props.onRequestClose}
      >
        <Wrapper>
          <Image />
          {this.renderForm()}
          {this.renderButtons()}
        </Wrapper>
      </Modal>
    );
  }
}

export default MetalHubModal;
