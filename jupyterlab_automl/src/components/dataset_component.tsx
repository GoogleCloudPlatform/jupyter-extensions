import { Box, Grid, LinearProgress } from '@material-ui/core';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import * as csstips from 'csstips';
import { ColumnType } from 'gcp_jupyterlab_shared';
import MaterialTable from 'material-table';
import * as React from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { stylesheet } from 'typestyle';
import { Dataset, TableSpec } from '../service/dataset';

interface DetailPanelProps {
  dataType: string;
  chartInfo: any[];
}

interface SummaryProps {
  tableSpec: TableSpec;
}

interface Props {
  dataset: Dataset;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  tableSpecs: TableSpec[];
}

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '14px',
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px 8px 24px',
  },
  panel: {
    backgroundColor: 'white',
    height: '100%',
    ...csstips.vertical,
  },
  list: {
    margin: 0,
    overflowY: 'scroll',
    padding: 0,
    ...csstips.flex,
  },
  paper: {
    padding: '16px',
    textAlign: 'left',
    fontSize: 'var(--jp-ui-font-size1)',
  },
});

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

const columns = [
  {
    title: 'Column name',
    field: 'displayName',
    type: ColumnType.String,
  },
  {
    title: 'Data Type',
    field: 'dataType',
    type: ColumnType.String,
  },
  {
    title: 'Nullable',
    field: 'nullable',
    type: ColumnType.Boolean,
  },
  {
    title: 'Missing Values (%)',
    field: 'nullValueCount',
    type: ColumnType.String,
  },
  {
    title: 'Invalid Values',
    field: 'invalidValueCount',
    type: ColumnType.Numeric,
  },
  {
    title: 'Distinct Value Count',
    field: 'distinctValueCount',
    type: ColumnType.Numeric,
  },
];

export class DatasetSummary extends React.Component<SummaryProps> {
  constructor(props: SummaryProps) {
    super(props);
  }

  render() {
    const getColor = (dataType: string) => {
      switch (dataType) {
        case 'Numeric': {
          return '#4285F4';
        }
        case 'Categorical': {
          return '#34A853';
        }
        case 'Timestamp': {
          return '#9C39F8';
        }
        default: {
          return '#DC3912';
        }
      }
    };
    return (
      <Grid item xs={12}>
        <Box component="div" overflow="auto" className={localStyles.paper}>
          <b>Summary</b>
          <p>Total Columns: {this.props.tableSpec.columnCount}</p>
          <p>Total Rows: {this.props.tableSpec.rowCount}</p>
          <BarChart
            width={300}
            height={30 + 30 * this.props.tableSpec.chartSummary.length}
            data={this.props.tableSpec.chartSummary}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              tick={{ fill: 'black' }}
            />
            <XAxis type="number" tickCount={3} tick={{ fill: 'black' }} />
            <Tooltip />
            <Bar dataKey="Number of Instances">
              {this.props.tableSpec.chartSummary.map(item => (
                <Cell key={item.name} fill={getColor(item.name)} />
              ))}
            </Bar>
          </BarChart>
        </Box>
      </Grid>
    );
  }
}

export class DetailPanel extends React.Component<DetailPanelProps> {
  constructor(props: DetailPanelProps) {
    super(props);
  }

  renderColorfulLegendText(value) {
    if (value.length >= 12) {
      return <span>{value.substring(0, 11)}</span>;
    } else {
      return <span>{value}</span>;
    }
  }

  render() {
    if (this.props.dataType === 'Numeric') {
      return (
        <div style={{ padding: '15px' }}>
          <p>Mean: {this.props.chartInfo[1]}</p>
          <p>Standard Deviation: {this.props.chartInfo[2]}</p>
          <div style={{ paddingTop: '15px' }}>
            <b>Distribution</b>
            <BarChart
              width={300}
              height={180}
              data={this.props.chartInfo[0]}
              margin={{
                top: 20,
                right: 5,
                left: 5,
                bottom: 20,
              }}
            >
              <XAxis dataKey="name" interval="preserveEnd" />
              <YAxis
                tick={{ fill: 'black' }}
                label={{
                  value: 'Number of Instances',
                  angle: -90,
                  position: 'insideBottomLeft',
                }}
              />
              <Tooltip />
              <Bar dataKey="Number of Instances" fill="#3366CC" />
            </BarChart>
          </div>
        </div>
      );
    } else if (this.props.dataType === 'Categorical') {
      const COLORS = [
        '#3366CC',
        '#DC3912',
        '#FF9900',
        '#109618',
        '#990099',
        '#0099C6',
      ];
      const RADIAN = Math.PI / 180;
      const renderCustomizedLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
      }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent >= 0.05) {
          return (
            <text
              x={x}
              y={y}
              fill="white"
              textAnchor={x > cx ? 'start' : 'end'}
              dominantBaseline="central"
            >
              {`${(percent * 100).toFixed(0)}%`}
            </text>
          );
        } else {
          return (
            <text
              x={x}
              y={y}
              fill="white"
              textAnchor={x > cx ? 'start' : 'end'}
              dominantBaseline="central"
            ></text>
          );
        }
      };
      return (
        <div style={{ padding: '15px' }}>
          <p>Most Common: {this.props.chartInfo[1]}</p>
          <div style={{ paddingTop: '15px' }}>
            <b>Distribution</b>
            <PieChart width={400} height={200}>
              <Pie
                dataKey="Number of Instances"
                isAnimationActive={false}
                labelLine={false}
                label={renderCustomizedLabel}
                data={this.props.chartInfo[0]}
                cx={125}
                cy={100}
                innerRadius={25}
                outerRadius={90}
                fill="#3366CC"
              >
                {this.props.chartInfo[0].map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                formatter={this.renderColorfulLegendText}
                layout={'vertical'}
                verticalAlign={'middle'}
                height={200}
                wrapperStyle={{
                  overflow: 'scroll',
                  paddingTop: '10px',
                }}
                align={'right'}
              />
            </PieChart>
          </div>
        </div>
      );
    } else if (this.props.dataType === 'Timestamp') {
      return (
        <div style={{ padding: '15px' }}>
          <Grid container spacing={0}>
            <Grid item xs={4}>
              <b>Month</b>
              <BarChart
                width={300}
                height={250}
                data={this.props.chartInfo[0]}
                layout="vertical"
                margin={{
                  right: 5,
                  left: 5,
                }}
              >
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  tick={{ fill: 'black' }}
                />
                <XAxis
                  type="number"
                  tick={{ fill: 'black' }}
                  interval="preserveEnd"
                />
                <Tooltip />
                <Bar dataKey="Number of Instances" fill="#3366CC" />
              </BarChart>
            </Grid>
            <Grid item xs={4}>
              <b>Day of the week</b>
              <BarChart
                width={300}
                height={250}
                data={this.props.chartInfo[1]}
                layout="vertical"
                margin={{
                  right: 5,
                  left: 5,
                }}
              >
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  tick={{ fill: 'black' }}
                />
                <XAxis
                  type="number"
                  tick={{ fill: 'black' }}
                  interval="preserveEnd"
                />
                <Tooltip />
                <Bar dataKey="Number of Instances" fill="#3366CC" />
              </BarChart>
            </Grid>
            <Grid item xs={4}>
              <b>Hour</b>
              <BarChart
                width={300}
                height={250}
                data={this.props.chartInfo[2]}
                layout="vertical"
                margin={{
                  right: 5,
                  left: 5,
                }}
              >
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  tick={{ fill: 'black' }}
                />
                <XAxis
                  type="number"
                  tick={{ fill: 'black' }}
                  interval="preserveEnd"
                />
                <Tooltip />
                <Bar dataKey="Number of Instances" fill="#3366CC" />
              </BarChart>
            </Grid>
          </Grid>
        </div>
      );
    } else {
      return (
        <div style={{ padding: '15px' }}>
          <p>This data type does not have supported visualizations.</p>
        </div>
      );
    }
  }
}

export class DatasetComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      tableSpecs: [],
    };
  }

  async componentDidMount() {
    this.getTableDetails();
  }

  render() {
    const { isLoading, tableSpecs } = this.state;
    return (
      <div className={localStyles.panel}>
        <header className={localStyles.header}>
          {this.props.dataset.displayName}
        </header>
        {isLoading ? (
          <LinearProgress />
        ) : tableSpecs.length === 0 ? (
          <p className={localStyles.paper}>
            Dataset is empty. Please import data.
          </p>
        ) : (
          <ul className={localStyles.list}>
            {tableSpecs.map(tableSpec => (
              <div key={tableSpec.id}>
                <Grid container spacing={0} direction="column">
                  <DatasetSummary tableSpec={tableSpec} />
                  <Grid item xs={12}>
                    <MaterialTable
                      columns={columns.map((col: any) => {
                        return {
                          field: col.field,
                          title: col.title,
                          type: col.type,
                          // width: col.title == 'p' ? 45 : undefined,
                          cellStyle: {
                            ...(style.tableCell as object),
                            padding: '5 px 16px 5px 16px',
                          },
                          headerStyle: style.headerCell,
                        };
                      })}
                      data={tableSpec.columnSpecs}
                      options={{
                        showTitle: false,
                        search: false,
                        sorting: true,
                        padding: 'dense',
                        toolbar: false,
                        paging: false,
                        rowStyle: style.tableRow,
                      }}
                      style={style.table}
                      isLoading={this.state.isLoading}
                      detailPanel={[
                        {
                          render: rowData => {
                            return (
                              <DetailPanel
                                dataType={rowData.dataType}
                                chartInfo={
                                  tableSpec.columnSpecs.filter(
                                    columnSpec => columnSpec.id === rowData.id
                                  )[0].detailPanel
                                }
                              />
                            );
                          },
                        },
                      ]}
                      onRowClick={(event, rowData, togglePanel) =>
                        togglePanel()
                      }
                    />
                  </Grid>
                </Grid>
              </div>
            ))}
          </ul>
        )}
      </div>
    );
  }

  private async getTableDetails() {
    try {
      this.setState({ isLoading: true });
      const tableSpecs = [];
      this.setState({ hasLoaded: true, tableSpecs: tableSpecs });
    } catch (err) {
      console.warn('Error retrieving table details', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }
}
