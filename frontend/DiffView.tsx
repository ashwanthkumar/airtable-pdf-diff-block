import React, { useState, useEffect } from 'react';
import _, { update } from 'lodash';
import { useViewport, Box, Heading, ProgressBar, useBase, Button } from '@airtable/blocks/ui';
import PQueue from 'p-queue';
import { useSettings } from './settings';
import { Record, FieldType } from '@airtable/blocks/models';
import { useLocalStorage } from './use_local_storage';
import { PdfDiffServiceClient } from './PdfDiffServiceClient';

const queue = new PQueue({ concurrency: 1 });

const diffResultColName = "Doc Diff"
const hasDiffColName = "Has Changed"

export function DiffView({ appState, setAppState }) {
  const settings = useSettings();
  const viewport = useViewport();
  const base = useBase();

  const [hasFinished, setHasFinished] = useLocalStorage<boolean>('diff.hasFinished', false);
  const [progress, setProgress] = useLocalStorage<number>('diff.progress', hasFinished ? 1.0 : 0.0);
  const [currentStep, setCurrentStep] = useLocalStorage<string>('diff.currentStep', hasFinished ? 'Diff Complete' : 'Initializing');

  const sourceTable = base.getTableByNameIfExists(appState.state.source.table);
  const prevDocField = appState.state.source.prevField;
  const currentDocField = appState.state.source.currentField;

  const pdfDiffClient = new PdfDiffServiceClient(settings.settings.pdfDiffEndpoint);

  const computeDiff = async () => {
    setHasFinished(false);
    setProgress(0.0);
    setCurrentStep('Initializing');
    const diffResultCol = sourceTable.getFieldByNameIfExists(diffResultColName);
    if (!diffResultCol) {
      await sourceTable.unstable_createFieldAsync(diffResultColName, FieldType.MULTIPLE_ATTACHMENTS);
    }
    const hasDiffCol = sourceTable.getFieldByNameIfExists(hasDiffColName);
    if (!hasDiffCol) {
      await sourceTable.unstable_createFieldAsync(hasDiffColName, FieldType.SINGLE_LINE_TEXT);
    }

    const queryData = await sourceTable.selectRecordsAsync();
    const total = queryData.records.length;

    const diff = async (record: Record, index: number) => {
      const prediction = record.getCellValue(diffResultColName);
      if (!prediction) {
        const prev = record.getCellValue(prevDocField);
        const current = record.getCellValue(currentDocField);
        if (prev && current) {
          const i = prev[0];// we only pick the first pdf from the attachments
          const j = current[0];// we only pick the first pdf from the attachments
          // console.log(i);

          const responseFromAirtable_prev = await fetch(i.url);
          const prevDoc = await responseFromAirtable_prev.blob();

          const responseFromAirtable_current = await fetch(j.url);
          const currentDoc = await responseFromAirtable_current.blob();
          setCurrentStep(`Computing Diff for ${index + 1} out of ${total} records.`);
          try {
            const response = await pdfDiffClient.computeDiff(prevDoc, currentDoc);
            // console.log("Emitting the Diff PNG URl -- " + response.diffPngUrl);
            if (response.status) {
              await sourceTable.updateRecordAsync(record.id, {
                [diffResultColName]: response.hasDiff ? [{ url: response.diffPngUrl }] : [],
                [hasDiffColName]: response.hasDiff ? 'Yes' : 'No',
              });
            }
          } catch (e) {
            console.log(e);
          }
        }
      } else {
        // console.log("Already predicted, skipping record");
      }

      setProgress((index + 1) / total);
      setCurrentStep(`Computed Diff for ${index + 1} out of ${total} records.`)
    }
    const allDiffs = queryData.records.map(function (record, index) {
      return (() => diff(record, index));
    });

    await queue.addAll(allDiffs);
    await queue.onEmpty();
    queryData.unloadData();
    setHasFinished(true);
  }

  const startOver = () => {
    window.localStorage.clear();
    setAppState({ index: 1, state: {} });
  }

  const redo = () => {
    computeDiff();
  }

  useEffect(() => {
    if (!hasFinished) {
      computeDiff();
    }
  }, [sourceTable]);

  return (
    <Box display="flex" alignItems="center" justifyContent="center" border="default" flexDirection="column" width={viewport.size.width} height={viewport.size.height} padding={0} className='review-settings'>
      <Box maxWidth='580px'>
        <Box paddingBottom='10px' display='flex' alignItems='center' justifyContent='center'>
          <Heading size='xlarge'>
            {!hasFinished && "Document Processing"}
            {hasFinished && "Document Processing Complete"}
          </Heading>
        </Box>

        <Box>
          <Box display='flex'>
            <Heading size='xsmall'>{currentStep}</Heading>
          </Box>
          <ProgressBar progress={progress} />
        </Box>

        {hasFinished &&
          <Box display='flex' alignItems='center' justifyContent='space-between' padding='20px'>
            <Button variant='primary' icon='history' onClick={startOver}>Start Over</Button>
            <Button variant='danger' icon='redo' onClick={redo}>Re-do</Button>
          </Box>
        }
      </Box>
    </Box>
  );
}