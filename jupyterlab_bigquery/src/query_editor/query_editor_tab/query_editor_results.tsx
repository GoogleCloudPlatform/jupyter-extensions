import * as React from 'react';
import { stylesheet } from 'typestyle';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
} from '@material-ui/core';

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '18px',
    margin: 0,
    padding: '8px 12px 8px 24px',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    color: 'black',
  },
  tableCell: {
    border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  },
  pagination: {
    // position: 'fixed',
    // bottom: 30,
  },
  tab: {
    textTransform: 'none',
    // minWidth: 72,
    // fontWeight: theme.typography.fontWeightRegular,
    // marginRight: theme.spacing(4),
    '&:hover': {
      color: '#40a9ff',
      opacity: 1,
    },
    '&$selected': {
      color: '#1890ff',
      //   fontWeight: theme.typography.fontWeightMedium,
    },
    '&:focus': {
      color: '#40a9ff',
    },
  },
});

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

export const QueryResults = () => {
  const fields = ['name', 'gender', 'count'];

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const rows = [
    createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
    createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
    createData('Eclair', 262, 16.0, 24, 6.0),
    createData('Cupcake', 305, 3.7, 67, 4.3),
    createData('Gingerbread', 356, 16.0, 49, 3.9),
    createData('hey', 1, 1, 1, 1),
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  //   const handleFirstPageButtonClick = event => {
  //     onChangePage(event, 0);
  //   };

  return (
    <div style={{ flexGrow: 1 }}>
      <div className={localStyles.header}>Query results</div>

      <div>
        <Table size="small">
          <TableHead className={localStyles.tableHeader}>
            <TableRow>
              {fields.map(field => (
                <TableCell>{field}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(row => (
                <TableRow key={row.name}>
                  <TableCell className={localStyles.tableCell}>
                    {row.calories}
                  </TableCell>
                  <TableCell className={localStyles.tableCell}>
                    {row.fat}
                  </TableCell>
                  <TableCell className={localStyles.tableCell}>
                    {row.carbs}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          className={localStyles.pagination}
          rowsPerPageOptions={[10, 30, 50, 100, 200]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </div>
    </div>
  );
};
