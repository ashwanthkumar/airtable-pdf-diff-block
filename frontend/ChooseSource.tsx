import {
  Box,
  Heading,
  FormField,
  Input,
  TablePicker,
  FieldPicker,
  useViewport,
  Button
} from '@airtable/blocks/ui';
import { FieldType, Table, Field } from '@airtable/blocks/models';

import React, { useState } from 'react';

export function ChooseSource({ appState, setAppState }) {
  const viewport = useViewport();
  const [table, setTable] = useState<Table>(null);
  const [prev, setPrev] = useState<Field>(null);
  const [current, setCurrent] = useState<Field>(null);

  const isValid = table && prev;

  const next = (e) => {
    // console.log(appState);
    e.preventDefault();
    const updatedAppState = { ...appState };
    // console.log(updatedAppState);
    updatedAppState.index = updatedAppState.index + 1;
    updatedAppState.state.source = {
      table: table.name,
      prevField: prev.name,
      currentField: current.name,
    }
    setAppState(updatedAppState);
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="center" border="default" flexDirection="column" width={viewport.size.width} height={viewport.size.height} padding={0}>
      <Box maxWidth='460px'>
        <Box paddingBottom='10px'>
          <Heading size="xlarge">Choose Source</Heading>
        </Box>
        <form onSubmit={next}>
          <Box>
            <FormField label="Select Source Table">
              <TablePicker
                table={table}
                onChange={newTable => setTable(newTable)}
                width="320px"
              />
            </FormField>
          </Box>

          {table && <Box>
            <FormField label="Select Older Document Column (Only Attachments)">
              <FieldPicker
                table={table}
                field={prev}
                onChange={newField => setPrev(newField)}
                allowedTypes={[FieldType.MULTIPLE_ATTACHMENTS]}
                width="320px"
              />
            </FormField>
          </Box>
          }

          {table && <Box>
            <FormField label="Select Current Document Column (Only Attachments)">
              <FieldPicker
                table={table}
                field={current}
                onChange={newField => setCurrent(newField)}
                allowedTypes={[FieldType.MULTIPLE_ATTACHMENTS]}
                width="320px"
              />
            </FormField>
          </Box>
          }

          {isValid &&
            <Box flexDirection='row-reverse'>
              <Button variant="primary" onClick={next}>Start Computing Diff</Button>
            </Box>}
        </form>
      </Box>
    </Box>
  );
}