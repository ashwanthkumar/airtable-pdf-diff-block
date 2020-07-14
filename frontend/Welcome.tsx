import {
  Box,
  Text,
  FormField,
  InputSynced,
  useViewport,
  useGlobalConfig,
  Heading,
  Button,
  Icon,
  Loader,
} from '@airtable/blocks/ui';

import React, { useState, useEffect } from 'react';
import { PDF_DIFF_SVC_URL, DEFAULT_PDF_DIFF_ENDPOINT } from './settings';
import { isEmpty } from './utils';
import GlobalConfig from '@airtable/blocks/dist/types/src/global_config';

async function checkForDefaults(globalConfig: GlobalConfig) {
  const pdfDiffUrl = globalConfig.get(PDF_DIFF_SVC_URL) as string;

  if (isEmpty(pdfDiffUrl)) {
    await globalConfig.setAsync(PDF_DIFF_SVC_URL, DEFAULT_PDF_DIFF_ENDPOINT);
  }
}

export function Welcome({ appState, setAppState, setIsSettingsVisible }) {
  const globalConfig = useGlobalConfig();

  useEffect(() => {
    // Set the default AUTOML_PROXY and GS_PROXY if not set already
    checkForDefaults(globalConfig);
  }, [globalConfig]);

  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const viewport = useViewport();
  const validateSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!appState.index) {
      const updatedAppState = { ...appState };
      // console.log(updatedAppState);
      // console.log(JSON.stringify(updatedAppState));
      updatedAppState.index = 1;
      setAppState(updatedAppState);
    }

    setIsSettingsVisible(false);
  }

  return (
    <Box display="flex" height={viewport.size.height} alignItems="center" justifyContent="center" border="default" flexDirection="column" padding='20px 0px'>
      <Box maxWidth='460px'>
        <Box paddingBottom='10px'>
          <Heading size="xlarge">Welcome to PDF Diff Block</Heading>
        </Box>

        <Box paddingBottom='10px'>
          <Text variant="paragraph" size="xlarge">
            To use this block, you need to enter the url of the PDF Diff Service.
          </Text>
          <Heading size="xsmall">
            Note: These values will be accessible to everyone who has access to this base.
          </Heading>
        </Box>
        <form onSubmit={validateSettings}>
          <Box>
            <FormField label="PDF Diff Service URL">
              <InputSynced className='blur-on-lose-focus' required={true} globalConfigKey={PDF_DIFF_SVC_URL} />
            </FormField>
          </Box>

          <Box>
            {
              errorMessage !== "" && <Text paddingBottom='5px' textColor='red'>Note: {errorMessage}</Text>
            }
            <Button icon={isLoading && <Loader /> || <Icon name='premium' fillColor='yellow' />} variant="primary" disabled={isLoading} onClick={validateSettings}>Save Settings</Button>
          </Box>

        </form>
      </Box>
    </Box>
  );
}
