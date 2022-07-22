const oracledb = require('oracledb');

async function run() {

  let connection;

  try {

    connection = await oracledb.getConnection({ user: "scmmweb", password: "scmmweb", connectionString: "172.20.0.225:1622/mvhml" });

    console.log("Successfully connected to Oracle Database");

    // Create a table

    await connection.execute(`begin
                                execute immediate 'drop table scmmweb.todoitem';
                                exception when others then if sqlcode <> -942 then raise; end if;
                              end;`);

    await connection.execute(`
      create table scmmweb.todoitem (
        id number
        , description varchar2(4000)
        , creation_ts timestamp with time zone default current_timestamp
        , done number(1,0)
        , primary key (id)
      )`);

    // Insert some data

    const sql = `insert into scmmweb.todoitem(id, description, done) values(:1, :2, :3)`;

    const rows =
          [ [1, "Task 1", 0 ],
            [2, "Task 2", 0 ],
            [3, "Task 3", 1 ],
            [4, "Task 4", 0 ],
            [5, "Task 5", 1 ] ];

    let result = await connection.executeMany(sql, rows);

    console.log(result.rowsAffected, "Rows Inserted");

    connection.commit();

    // Now query the rows back

    result = await connection.execute(
      `select description, done from scmmweb.todoitem`,
      [],
      { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });

    const rs = result.resultSet;
    let row;

    while ((row = await rs.getRow())) {
      if (row.DONE)
        console.log(row.DESCRIPTION, "is done");
      else
        console.log(row.DESCRIPTION, "is NOT done");
    }

    await rs.close();

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

run();