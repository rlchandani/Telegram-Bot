import React, { useState, useEffect } from "react";
import _ from "lodash";
import { Table, Input, Pagination, Dropdown, Icon, Label } from "semantic-ui-react";
import "./performanceDetailTable.css";

export namespace PerformanceDetailTableOptions {
  export enum SortOrder {
    Ascending = "ascending",
    Descending = "descending",
  }

  export interface SortOptions {
    key: string;
    direction: SortOrder;
  }

  export interface TableHeader {
    [key: number]: TableHeaderItem;
  }

  export interface TableHeaderItem {
    key: string;
    value: string;
  }

  export interface TableData {
    [key: string]: string;
  }

  export const EntryOptions = {
    options: [
      { key: 10, text: "10 Entries", value: 10 },
      { key: 25, text: "25 Entries", value: 25 },
      { key: 50, text: "50 Entries", value: 50 },
      { key: 100, text: "100 Entries", value: 100 },
      { key: -1, text: "All Entries", value: 999999 },
    ],
    selected: 10,
  };
}

const decodeHtml = (html: any) => <div dangerouslySetInnerHTML={{ __html: html }} />;

interface PerformanceDetailTableProps {
  tableHeader: PerformanceDetailTableOptions.TableHeader;
  tableData: PerformanceDetailTableOptions.TableData[];
  sortable?: boolean;
  sortOptions?: PerformanceDetailTableOptions.SortOptions;
  selectable?: boolean;
  striped?: boolean;
  searchable?: boolean;
  paginated?: boolean;
  globalSearch?: boolean;
}

const PerformanceDetailTable = (props: PerformanceDetailTableProps) => {
  const {
    tableHeader,
    tableData,
    sortable = false,
    sortOptions = { key: tableHeader[0].key, direction: PerformanceDetailTableOptions.SortOrder.Ascending },
    selectable = false,
    striped = false,
    searchable = false,
    paginated = false,
    globalSearch = false,
  } = props;
  const [data, setData] = useState<any>([]);
  const [paginatedData, setPaginatedData] = useState<any>([]);
  const [itemsEachPage, setItemsEachPage] = useState<number>(PerformanceDetailTableOptions.EntryOptions.selected);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [sortColumn, setSortColumn] = useState<any>(sortOptions.key);
  const [sortDirection, setSortDirection] = useState<PerformanceDetailTableOptions.SortOrder>(sortOptions.direction);
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const [filteredDataLength, setFilteredDataLength] = useState<number>(0);
  const [search, setSearch] = useState<any>([]);
  const [globalSearchText, setGlobalSearchText] = useState<string>("");

  const paginationInfo = () => {
    const dataLength = filteredDataLength;
    let endLength = currentPage * itemsEachPage;
    let startLength = endLength - (itemsEachPage - 1);
    if (endLength > dataLength) {
      endLength = dataLength;
    }
    if (startLength > dataLength) {
      startLength = dataLength;
    }
    return `Showing ${startLength} to ${endLength} of ${dataLength} entries`;
  };

  const limitData = (localData: any, startIndex: any) =>
    paginated
      ? localData.filter((row: any, index: any) => index >= (startIndex - 1) * itemsEachPage && index < startIndex * itemsEachPage)
      : localData;

  const filterData = (localData: any) => {
    const filtersCount = Object.keys(search).filter((key: any) => search[key] !== "").length;
    let dataLength;
    let filteredData = localData;
    if (globalSearchText === "" && Object.keys(search).filter((key: any) => search[key] !== "").length === 0) {
      dataLength = data.length;
      setIsFiltered(false);
      setFilteredDataLength(dataLength);
      setTotalPages(Math.ceil(dataLength / itemsEachPage));
      return localData;
    }
    if (globalSearchText !== "") {
      const searchRegularExpress = new RegExp(globalSearchText, "i");
      filteredData = filteredData.filter(
        (row: any) => Object.keys(tableHeader).filter((key: any) => row[tableHeader[key].key].toString().search(searchRegularExpress) >= 0).length > 0
      );
    }
    if (filtersCount > 0) {
      filteredData = filteredData.filter(
        (row: any) =>
          Object.keys(search).reduce(
            (accumulator: any, key: any) =>
              accumulator + (search[key] !== "" && row[tableHeader[key].key].toString().search(new RegExp(search[key], "i")) >= 0 ? 1 : 0),
            0
          ) === filtersCount
      );
    }
    dataLength = filteredData.length;
    setIsFiltered(true);
    setFilteredDataLength(dataLength);
    setTotalPages(Math.ceil(dataLength / itemsEachPage));
    return filteredData;
  };

  const handleSort = (clickedColumn: any) => () => {
    if (sortable) {
      let sortedData;
      setCurrentPage(1);
      if (sortColumn !== clickedColumn) {
        sortedData = _.sortBy(data, getSortKeysSequence(clickedColumn));
        setSortColumn(clickedColumn);
        setSortDirection(PerformanceDetailTableOptions.SortOrder.Ascending);
      } else {
        sortedData = data.reverse();
        setSortDirection(
          sortDirection === PerformanceDetailTableOptions.SortOrder.Ascending
            ? PerformanceDetailTableOptions.SortOrder.Descending
            : PerformanceDetailTableOptions.SortOrder.Ascending
        );
      }
      setData(sortedData);
    }
  };

  const handlePaginationChange = (e: any, { activePage }: any) => {
    setCurrentPage(activePage);
    setPaginatedData(limitData(filterData(data), activePage));
  };

  const renderTableHeaderSearchField = () => {
    if (searchable) {
      return (
        <Table.Row>
          {Object.keys(tableHeader).map((key: any) => {
            return (
              <Table.HeaderCell key={tableHeader[key].key} className="search-header-cell">
                <Input
                  fluid
                  icon="search"
                  placeholder={`Search ${tableHeader[key].value}`}
                  className="search-header-cell-field"
                  onChange={(event, { value }) => {
                    setSearch({ ...search, [key]: value });
                  }}
                />
              </Table.HeaderCell>
            );
          })}
        </Table.Row>
      );
    }
    return null;
  };

  const renderTableHeader = () => {
    return (
      <Table.Row>
        {Object.keys(tableHeader).map((key: any) => {
          return (
            <Table.HeaderCell
              key={tableHeader[key].key}
              sorted={sortColumn === tableHeader[key].key ? sortDirection : undefined}
              onClick={handleSort(tableHeader[key].key)}
            >
              {tableHeader[key].value}
            </Table.HeaderCell>
          );
        })}
      </Table.Row>
    );
  };

  const renderTableFooter = () => {
    return Object.keys(tableHeader).map((key: any) => {
      return <Table.HeaderCell key={tableHeader[key].key}>{tableHeader[key].value}</Table.HeaderCell>;
    });
  };

  const renderTableData = () => {
    return paginatedData.length > 0 ? (
      paginatedData.map((row: any) => (
        <Table.Row key={Math.random()} verticalAlign="top">
          {Object.keys(tableHeader).map((cell: any) => (
            <Table.Cell key={Math.random()}>{decodeHtml(row[tableHeader[cell].key])}</Table.Cell>
          ))}
        </Table.Row>
      ))
    ) : (
      <Table.Row key={Math.random()}>
        <Table.Cell colSpan="100%" key={Math.random()} className="align-center">
          No data found!
        </Table.Cell>
      </Table.Row>
    );
  };

  const getSortKeysSequence = (clickedColumn?: string) => {
    const tempSeq = _.chain(tableHeader)
      .sortBy(_.keys(tableHeader))
      .map((e) => e.key)
      .filter((e) => e !== clickedColumn || sortColumn)
      .value();
    tempSeq.unshift(clickedColumn || sortColumn);
    return tempSeq;
  };

  useEffect(() => {
    if (sortable) {
      let sortedData = _.sortBy(tableData, getSortKeysSequence());
      if (sortDirection === PerformanceDetailTableOptions.SortOrder.Descending) {
        sortedData = sortedData.reverse();
      }
      setData(sortedData);
    } else {
      setData(tableData);
    }
  }, [tableData]);

  useEffect(() => {
    if (paginated) {
      setPaginatedData(limitData(filterData(data), 1));
      setCurrentPage(1);
    } else {
      setPaginatedData(filterData(data));
    }
  }, [data, sortColumn, sortDirection, search, globalSearchText, itemsEachPage]);

  return (
    <React.Fragment>
      {globalSearch ? (
        <Input
          fluid
          icon="search"
          placeholder="Global Search"
          onChange={(event, { value }) => {
            setGlobalSearchText(value);
          }}
        />
      ) : null}
      {paginated ? (
        <div>
          <Dropdown
            defaultValue={PerformanceDetailTableOptions.EntryOptions.selected}
            options={PerformanceDetailTableOptions.EntryOptions.options}
            placeholder="Entries"
            onChange={(e, { value }: any) => setItemsEachPage(value)}
            className="top"
            selection
          />
          <Label className="pagination-info" color="teal">
            <Icon name={isFiltered ? "filter" : "info"} />
            {paginationInfo()}
            {isFiltered ? ` (Total ${data.length} entries)` : null}
          </Label>
          <Pagination
            activePage={currentPage}
            totalPages={totalPages}
            disabled={totalPages <= 0}
            onPageChange={handlePaginationChange}
            className="top"
          />
        </div>
      ) : null}
      <Table sortable={sortable} celled selectable={selectable} striped={striped} className="table-custom">
        <Table.Header>
          {renderTableHeaderSearchField()}
          {renderTableHeader()}
        </Table.Header>

        <Table.Body>{renderTableData()}</Table.Body>

        <Table.Footer>
          <Table.Row>{renderTableFooter()}</Table.Row>
        </Table.Footer>
      </Table>
      {paginated ? (
        <div className="pagination-menu-clearfix">
          <Pagination
            activePage={currentPage}
            totalPages={totalPages}
            disabled={totalPages <= 0}
            onPageChange={handlePaginationChange}
            className="bottom"
          />
        </div>
      ) : null}
    </React.Fragment>
  );
};

export default PerformanceDetailTable;
