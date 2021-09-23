import React from "react";
import { useSelector } from "react-redux";
import { Table } from "semantic-ui-react";
import jp from "jsonpath";

const PerformanceTable = () => {
  const mentionedTickerNormalized = useSelector((state: any) => state.mentionedTickerNormalized.data);

  // useEffect(() => {
  //   console.log("RegisteredGroups", registeredGroup);
  // }, [registeredGroup]);

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell>Notes</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <Table.Row>
          <Table.Cell>{jp.query(mentionedTickerNormalized, "$..AMZN.total")}</Table.Cell>
          <Table.Cell>{jp.query(mentionedTickerNormalized, "$..AAPL.total")}</Table.Cell>
          <Table.Cell selectable>
            <a href="#edit">Edit</a>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Rohit</Table.Cell>
          <Table.Cell>Approved</Table.Cell>
          <Table.Cell selectable>
            <a href="#edit">Edit</a>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Jill</Table.Cell>
          <Table.Cell>Denied</Table.Cell>
          <Table.Cell selectable>
            <a href="#edit">Edit</a>
          </Table.Cell>
        </Table.Row>
        <Table.Row warning>
          <Table.Cell>John</Table.Cell>
          <Table.Cell>No Action</Table.Cell>
          <Table.Cell selectable warning>
            <a href="#edit">Requires change</a>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Jamie</Table.Cell>
          <Table.Cell positive>Approved</Table.Cell>
          <Table.Cell selectable positive>
            <a href="#edit">Approve</a>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Jill</Table.Cell>
          <Table.Cell negative>Denied</Table.Cell>
          <Table.Cell selectable negative>
            <a href="#edit">Remove</a>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  );
};

export default PerformanceTable;
