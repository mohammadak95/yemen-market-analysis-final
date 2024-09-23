// DataTable.js
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import PropTypes from 'prop-types';

const DataTable = ({ columns, data, title }) => (
  <TableContainer component={Paper}>
    <Table size="small">
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableCell key={col.field} align={col.align || 'left'}>
              <strong>{col.headerName}</strong>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={idx}>
            {columns.map((col) => (
              <TableCell key={col.field} align={col.align || 'left'}>
                {row[col.field]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

DataTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  title: PropTypes.string,
};

export default DataTable;