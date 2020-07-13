import { CSSProperties } from '@material-ui/core/styles/withStyles';
import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
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
import MaterialTable, { Icons, MTableBodyRow } from 'material-table';
import React, { forwardRef } from 'react';
import { ContextMenu } from './context_menu';

const tableIcons: Icons = {
  Add: forwardRef((props: any, ref: any) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props: any, ref: any) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props: any, ref: any) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props: any, ref: any) => (
    <DeleteOutline {...props} ref={ref} />
  )),
  DetailPanel: forwardRef((props: any, ref: any) => (
    <ChevronRight {...props} ref={ref} />
  )),
  Edit: forwardRef((props: any, ref: any) => <Edit {...props} ref={ref} />),
  Export: forwardRef((props: any, ref: any) => (
    <SaveAlt {...props} ref={ref} />
  )),
  Filter: forwardRef((props: any, ref: any) => (
    <FilterList {...props} ref={ref} />
  )),
  FirstPage: forwardRef((props: any, ref: any) => (
    <FirstPage {...props} fontSize="small" ref={ref} />
  )),
  LastPage: forwardRef((props: any, ref: any) => (
    <LastPage {...props} fontSize="small" ref={ref} />
  )),
  NextPage: forwardRef((props: any, ref: any) => (
    <ChevronRight {...props} fontSize="small" ref={ref} />
  )),
  PreviousPage: forwardRef((props: any, ref: any) => (
    <ChevronLeft {...props} fontSize="small" ref={ref} />
  )),
  ResetSearch: forwardRef((props: any, ref: any) => (
    <Clear {...props} ref={ref} />
  )),
  Search: forwardRef((props: any, ref: any) => <Search {...props} ref={ref} />),
  SortArrow: forwardRef((props: any, ref: any) => (
    <ArrowDownward {...props} fontSize="small" ref={ref} />
  )),
  ThirdStateCheck: forwardRef((props: any, ref: any) => (
    <Remove {...props} ref={ref} />
  )),
  ViewColumn: forwardRef((props: any, ref: any) => (
    <ViewColumn {...props} ref={ref} />
  )),
};

export enum ColumnType {
  Boolean = 'boolean',
  Time = 'time',
  Numeric = 'numeric',
  Date = 'date',
  DateTime = 'datetime',
  Currency = 'currency',
  String = 'string',
}

export interface ResourceColumn {
  field: string;
  title: string;
  type?: ColumnType;
  minShowWidth?: number;
  rightAlign?: boolean;
  render?: (rowData: any) => JSX.Element;
  fixedWidth?: number;
  sorting?: boolean;
  lookup?: { [k: string]: string };
  filtering?: boolean;
}

interface ContextMenuItem {
  label: string;
  handler: (data) => void;
}

interface Props {
  width: number;
  height: number;
  data: any[];
  columns: ResourceColumn[];
  isLoading?: boolean;
  onRowClick?: (rowData: any) => void;
  rowContextMenu?: ContextMenuItem[];
}

const style: CSSProperties = {
  table: {
    borderRadius: 0,
    boxShadow: 'none',
    borderTop: '1px solid var(--jp-border-color2)',
  },
  tableCell: {
    fontSize: 'var(--jp-ui-font-size1)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    padding: '5px 8px',
  },
  headerCell: {
    fontSize: 'var(--jp-ui-font-size1)',
    whiteSpace: 'nowrap',
    padding: '0px 8px',
  },
  tableRow: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

export class ListResourcesTable extends React.PureComponent<Props> {
  private rightAlign = (cls: Record<string, any>) => {
    return { ...cls, textAlign: 'right', flexDirection: 'row-reverse' };
  };

  render() {
    return (
      <MaterialTable
        icons={tableIcons}
        columns={this.props.columns.map((col: ResourceColumn) => {
          return {
            field: col.field,
            title: col.title,
            type: col.type,
            render: col.render,
            cellStyle: col.rightAlign
              ? this.rightAlign(style.tableCell)
              : style.tableCell,
            headerStyle: col.rightAlign
              ? this.rightAlign(style.headerCell)
              : style.headerCell,
            hidden: this.props.width < col.minShowWidth,
            width: col.fixedWidth,
            sorting: col.sorting === undefined ? true : col.sorting,
            filtering: col.filtering === undefined ? false : col.filtering,
            lookup: col.lookup,
          };
        })}
        data={this.props.data}
        options={{
          showTitle: false,
          tableLayout: 'fixed',
          pageSize: 20,
          pageSizeOptions: [20],
          search: false,
          sorting: true,
          padding: 'dense',
          toolbar: false,
          rowStyle: style.tableRow,
          minBodyHeight: this.props.height - 52,
          maxBodyHeight: this.props.height - 52,
        }}
        style={style.table}
        isLoading={this.props.isLoading}
        onRowClick={(_, rowData) => {
          if (this.props.onRowClick) {
            this.props.onRowClick(rowData);
          }
        }}
        components={{
          Row: props =>
            this.props.rowContextMenu ? (
              <ContextMenu
                items={this.props.rowContextMenu.map(item => ({
                  label: item.label,
                  onClick: () => item.handler(props.data),
                }))}
              >
                <MTableBodyRow {...props}></MTableBodyRow>
              </ContextMenu>
            ) : (
              <MTableBodyRow {...props}></MTableBodyRow>
            ),
        }}
      />
    );
  }
}
