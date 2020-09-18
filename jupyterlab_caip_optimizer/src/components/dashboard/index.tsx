import * as React from 'react';
import { Typography, Button, Box } from '@material-ui/core';
import MaterialTable from 'material-table';
import moment from 'moment';
import { Launch } from '@material-ui/icons';
import { connect } from 'react-redux';
import AddIcon from '@material-ui/icons/Add';
import { prettifyStudyName } from '../../service/optimizer';
import { dateFormat, makeReadable } from '../../utils';
import { Study } from '../../types';
import { setView } from '../../store/view';
import { deleteStudy } from '../../store/studies';
import { styles } from '../../utils/styles';
import { Loading } from '../misc/loading';
import { tableIcons } from '../../utils/table_icons';

const columns = [
  {
    title: 'Name',
    field: 'name',
    render: study => prettifyStudyName(study.name),
  },
  { title: 'State', field: 'state' },
  {
    title: 'Objective',
    field: 'metrics',
  },
  {
    title: 'Date Created',
    field: 'createTime',
    render: study => moment(study.createTime).format(dateFormat),
    customSort: (a, b) => {
      const aDate = moment(a.createTime);
      const bDate = moment(b.createTime);
      return aDate.diff(bDate);
    },
  },
];

interface Props {
  loading: boolean;
  error?: string;
  studies?: Study[];
  openCreateStudy: () => void;
  openStudyDetails: (studyName: string) => void;
  deleteStudy: (studyName: string) => void;
}

interface MappedStudy {
  name: Study['name'];
  createTime: Study['createTime'];
  state: Study['state'];
  metrics: string;
}

const mapStateToProps = state => ({
  loading: state.studies.loading,
  studies: state.studies.data,
});

const mapDispatchToProps = dispatch => ({
  openCreateStudy: () => dispatch(setView({ view: 'createStudy' })),
  openStudyDetails: (studyName: string) =>
    dispatch(setView({ view: 'studyDetails', studyId: studyName })),
  deleteStudy: (studyName: string) => dispatch(deleteStudy(studyName)),
});

export const DashboardUnwrapped: React.FC<Props> = ({
  loading,
  studies,
  openCreateStudy,
  openStudyDetails,
  deleteStudy,
}) => {
  // studies needed to be mapped since material table edits props (a very bad antipattern) and redux (using immer) freezes the data
  // thus the data needs to be copied to become mutable
  // read more here:
  // https://stackoverflow.com/questions/59648434/material-table-typeerror-cannot-add-property-tabledata-object-is-not-extensibl
  const mappedStudies: MappedStudy[] = studies
    ? studies.map(study => ({
        name: study.name,
        createTime: study.createTime,
        state: study.state,
        metrics: study.studyConfig.metrics
          .map(metric => `${makeReadable(metric.goal)} "${metric.metric}"`)
          .join(', '),
      }))
    : undefined;

  return (
    <Box className={styles.root} pt={2} px={3}>
      <Box display="flex" my={2}>
        <Typography variant="h4" gutterBottom>
          Optimizer Dashboard
        </Typography>

        {/* Spacing Element */}
        <Box mx="auto" />

        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => openCreateStudy()}
            startIcon={<AddIcon />}
          >
            Create Study
          </Button>
        </Box>
      </Box>

      {loading && <Loading />}
      {!!mappedStudies && (
        <MaterialTable
          title="Studies"
          icons={tableIcons}
          columns={columns}
          data={mappedStudies}
          actions={[
            {
              icon: () => <Launch />,
              tooltip: 'Open Study',
              onClick: (event, study) => {
                if (!Array.isArray(study)) {
                  openStudyDetails(study.name);
                }
              },
            },
          ]}
          editable={{
            onRowDelete: async study => deleteStudy(study.name),
          }}
          options={{
            actionsColumnIndex: -1,
          }}
        />
      )}
    </Box>
  );
};
export const Dashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardUnwrapped);
