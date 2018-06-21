/*
Copyright (C) 2017  Cloudbase Solutions SRL
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

// @flow

import * as React from 'react'
import styled from 'styled-components'

import EndpointField from '../../../components/molecules/EndpointField'
import type { Field } from '../../../types/Field'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`
export const Fields = styled.div`
  display: flex;
  margin-top: 32px;
  flex-direction: column;
  overflow: auto;
`
export const FieldStyled = styled(EndpointField)`
  min-width: ${props => props.useTextArea ? '100%' : '224px'};
  max-width: 224px;
  margin-bottom: 16px;
`
export const Row = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
`

type Props = {
  connectionInfoSchema: Field[],
  validation: { valid: boolean, validation: { message: string } },
  invalidFields: string[],
  getFieldValue: (field: ?Field) => any,
  handleFieldChange: (field: Field, value: any) => void,
  disabled: boolean,
  cancelButtonText: string,
  validating: boolean,
  onRef: (contentPlugin: any) => void,
  passwordFields?: string[],
}
class ContentPlugin extends React.Component<Props> {
  componentDidMount() {
    this.props.onRef(this)
  }

  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  findInvalidFields = () => {
    const invalidFields = this.props.connectionInfoSchema.filter(field => {
      if (field.required) {
        let value = this.props.getFieldValue(field)
        return !value
      }
      return false
    }).map(f => f.name)

    return invalidFields
  }

  renderFields() {
    const rows = []
    let lastField
    let i = 0
    this.props.connectionInfoSchema.forEach((field, schemaIndex) => {
      let isPassword = this.props.passwordFields && this.props.passwordFields.find(fn => fn === field.name)
      const currentField = (
        <FieldStyled
          {...field}
          large
          disabled={this.props.disabled}
          password={isPassword}
          highlight={this.props.invalidFields.findIndex(fn => fn === field.name) > -1}
          value={this.props.getFieldValue(field)}
          onChange={value => { this.props.handleFieldChange(field, value) }}
        />
      )
      const pushRow = (field1: React.Node, field2?: React.Node) => {
        rows.push((
          <Row key={field.name}>
            {field1}
            {field2}
          </Row>
        ))
      }
      if (field.useTextArea || schemaIndex === this.props.connectionInfoSchema.length - 1) {
        pushRow(currentField)
        if (field.useTextArea) {
          i -= 1
        }
      } else if (i % 2 !== 0) {
        pushRow(lastField, currentField)
      } else {
        lastField = currentField
      }
      i += 1
    })

    return (
      <Fields>
        {rows}
      </Fields>
    )
  }

  render() {
    return (
      <Wrapper>
        {this.renderFields()}
      </Wrapper>
    )
  }
}

export default ContentPlugin
