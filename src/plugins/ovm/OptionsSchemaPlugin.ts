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

import type { InstanceScript } from '@src/@types/Instance'
import type { Field } from '@src/@types/Field'
import type { OptionValues, StorageMap } from '@src/@types/Endpoint'
import type { SchemaProperties, SchemaDefinitions } from '@src/@types/Schema'
import type { NetworkMap } from '@src/@types/Network'
import { UserScriptData } from '@src/@types/MainItem'
import DefaultOptionsSchemaPlugin, {
  defaultFillMigrationImageMapValues,
  defaultFillFieldValues,
  defaultGetDestinationEnv,
  defaultGetMigrationImageMap,
} from '../default/OptionsSchemaPlugin'

export default class OptionsSchemaParser {
  static migrationImageMapFieldName = 'migr_template_map'

  static parseSchemaToFields(opts: {
    schema: SchemaProperties,
    schemaDefinitions?: SchemaDefinitions | null | undefined,
    dictionaryKey?: string,
    requiresWindowsImage?: boolean,
  }) {
    const fields: Field[] = DefaultOptionsSchemaPlugin.parseSchemaToFields(opts)
    const makeRequired = (fieldName: string) => {
      const field = fields.find(f => f.name === fieldName)
      if (field) {
        field.required = true
      }
    }

    makeRequired('export_template')
    makeRequired('export_template_username')
    makeRequired('export_template_password')

    const useCoriolisExporterField = fields.find(f => f.name === 'use_coriolis_exporter')
    if (useCoriolisExporterField) {
      const usableFields: Field[] = [
        {
          ...useCoriolisExporterField,
          nullableBoolean: false,
          default: false,
          subFields: [
            {
              name: 'generic_exporter_options',
              type: 'object',
              properties: fields.filter(f => f.name !== 'use_coriolis_exporter')
                .map(f => ({ ...f, groupName: 'generic_exporter_options' })),
            },
            {
              name: 'ovm_exporter_options',
              type: 'object',
              properties: [],
            },
          ],
        },
      ]
      return usableFields
    }
    fields.forEach(f => {
      if (
        f.name !== 'migr_template_username_map'
        && f.name !== 'migr_template_password_map'
        && f.name !== 'migr_template_name_map'
      ) {
        return
      }

      const password = f.name === 'migr_template_password_map'
      f.properties = [
        {
          type: 'string',
          name: 'windows',
          required: opts.requiresWindowsImage,
          password,
        },
        {
          type: 'string',
          name: 'linux',
          required: true,
          password,
        },
      ]
    })

    return fields
  }

  static sortFields(fields: Field[]) {
    DefaultOptionsSchemaPlugin.sortFields(fields)
  }

  static fillFieldValues(opts: { field: Field, options: OptionValues[], requiresWindowsImage: boolean }) {
    const { field, options, requiresWindowsImage } = opts

    if (field.name === 'use_coriolis_exporter') {
      field.subFields?.forEach(sf => {
        if (sf.properties) {
          sf.properties.forEach(f => {
            DefaultOptionsSchemaPlugin.fillFieldValues({
              field: f, options, customFieldName: f.name.split('/')[1], requiresWindowsImage,
            })
            if (f.name === 'export_template' && f.enum) {
              f.enum = f.enum.map(newF => (typeof newF !== 'string' ? {
                ...newF,
                // @ts-ignore
                disabled: newF.os_type !== 'linux' && newF.os_type !== 'unknown',
                // @ts-ignore
                subtitleLabel: newF.os_type !== 'linux' && newF.os_type !== 'unknown' ? `Source plugins rely on a Linux-based temporary virtual machine to perform data exports, but the platform reports this image to be of OS type '${newF.os_type}'.` : '',
              } : newF))
            }
          })
        }
      })
    } else {
      const option = options.find(f => f.name === field.name)
      if (!option) {
        return
      }
      if (!defaultFillMigrationImageMapValues({
        field,
        option,
        migrationImageMapFieldName: this.migrationImageMapFieldName,
        requiresWindowsImage,
      })) {
        defaultFillFieldValues(field, option)
      }
    }
  }

  static getDestinationEnv(options: { [prop: string]: any } | null, oldOptions?: any) {
    let newOptions: any = { ...options }
    if (newOptions.use_coriolis_exporter != null) {
      newOptions = { use_coriolis_exporter: newOptions.use_coriolis_exporter }
    }
    if (options?.generic_exporter_options) {
      newOptions = { ...options.generic_exporter_options, use_coriolis_exporter: false }
    }
    const env = {
      ...defaultGetDestinationEnv(newOptions, oldOptions),
      ...defaultGetMigrationImageMap(
        newOptions,
        oldOptions,
        this.migrationImageMapFieldName,
      ),
    }
    return env
  }

  static getNetworkMap(networkMappings: NetworkMap[] | null | undefined) {
    return DefaultOptionsSchemaPlugin.getNetworkMap(networkMappings)
  }

  static getStorageMap(
    defaultStorage: { value: string | null, busType?: string | null },
    storageMap: StorageMap[] | null,
    configDefault?: string | null,
  ) {
    return DefaultOptionsSchemaPlugin.getStorageMap(defaultStorage, storageMap, configDefault)
  }

  static getUserScripts(
    uploadedUserScripts: InstanceScript[],
    removedUserScripts: InstanceScript[],
    userScriptData: UserScriptData | null | undefined,
  ) {
    return DefaultOptionsSchemaPlugin
      .getUserScripts(uploadedUserScripts, removedUserScripts, userScriptData)
  }
}
