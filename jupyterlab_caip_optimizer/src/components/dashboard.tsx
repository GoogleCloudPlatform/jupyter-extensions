import * as React from 'react';
import { forwardRef } from 'react';
import { Typography, Button, Box } from '@material-ui/core';
import MaterialTable from 'material-table';
import AddBox from '@material-ui/icons/AddBox';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import { deleteStudy } from '../store/studies';
import { setView } from '../store/view';
import { Study } from '../types';
import moment from 'moment';
import { Launch } from '@material-ui/icons';
import { prettifyStudyName } from '../service/optimizer';
import { connect } from 'react-redux';

const tableIcons = {
  Add: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <AddBox {...props} ref={ref} />
  )),
  Check: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Check {...props} ref={ref} />
  )),
  Clear: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Clear {...props} ref={ref} />
  )),
  Delete: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <DeleteOutline {...props} ref={ref} />
  )),
  DetailPanel: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ChevronRight {...props} ref={ref} />
  )),
  Edit: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Edit {...props} ref={ref} />
  )),
  Export: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <SaveAlt {...props} ref={ref} />
  )),
  Filter: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <FilterList {...props} ref={ref} />
  )),
  FirstPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <FirstPage {...props} ref={ref} />
  )),
  LastPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <LastPage {...props} ref={ref} />
  )),
  NextPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ChevronRight {...props} ref={ref} />
  )),
  PreviousPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ChevronLeft {...props} ref={ref} />
  )),
  ResetSearch: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Clear {...props} ref={ref} />
  )),
  Search: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Search {...props} ref={ref} />
  )),
  SortArrow: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ArrowUpward {...props} ref={ref} />
  )),
  ThirdStateCheck: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Remove {...props} ref={ref} />
  )),
  ViewColumn: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ViewColumn {...props} ref={ref} />
  )),
};

const dateFormat = 'h:mm a, MMM. D, YYYY';
const columns = [
  {
    title: 'Name',
    field: 'name',
    render: study => prettifyStudyName(study.name),
  },
  { title: 'State', field: 'state' },
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

const mapStateToProps = state => ({
  loading: state.studies.loading,
  error: state.studies.error,
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
  error,
  studies,
  openCreateStudy,
  openStudyDetails,
  deleteStudy,
}) => {
  // studies needed to be mapped since material table edits props (a very bad antipattern) and redux (using immer) freezes the data
  // thus the data needs to be copied to become mutable
  // read more here:
  // https://stackoverflow.com/questions/59648434/material-table-typeerror-cannot-add-property-tabledata-object-is-not-extensibl
  const mappedStudies = studies
    ? studies.map(study => ({
        ...study,
      }))
    : undefined;

  return (
    <Box pt={2} px={3} style={{ height: '100%', overflow: 'scroll' }}>
      <Typography variant="h4" gutterBottom>
        Optimizer Dashboard
      </Typography>
      {loading && <>Loading</>}
      {!!error && <>Error {error}</>}
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

      <Button color="primary" onClick={() => openCreateStudy()}>
        Create Study
      </Button>
    </Box>
  );
};
export const Dashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardUnwrapped);
