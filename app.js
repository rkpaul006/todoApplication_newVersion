const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const addDays = require("date-fns/addDays");
const isValid = require("date-fns/isValid");
const isMatch = require("date-fns/isMatch");
const format = require("date-fns/format");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const ifPriorityAndStatusGiven = (requestQuery) => {
  return requestQuery.priority != undefined && requestQuery.status != undefined;
};

const ifCategoryAndPriorityGiven = (requestQuery) => {
  return (
    requestQuery.category != undefined && requestQuery.priority != undefined
  );
};

const ifCategoryAndStatusGiven = (requestQuery) => {
  return requestQuery.category != undefined && requestQuery.status != undefined;
};

const ifCategoryGiven = (requestQuery) => {
  return requestQuery.category != undefined;
};

const ifPriorityGiven = (requestQuery) => {
  return requestQuery.priority != undefined;
};

const ifStatusGiven = (requestQuery) => {
  return requestQuery.status != undefined;
};

const convertObj = (reqObj) => {
  return {
    id: reqObj.id,
    todo: reqObj.todo,
    category: reqObj.category,
    priority: reqObj.priority,
    status: reqObj.status,
    dueDate: reqObj.due_date,
  };
};

//API-1//
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", category, priority, status } = request.query;

  switch (true) {
    case ifPriorityAndStatusGiven(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND status = '${status}';`;
          const getTodo = await db.all(getTodoQuery);
          response.send(getTodo.map((each) => convertObj(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case ifCategoryAndStatusGiven(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND category = '${category}'
                AND status = '${status}';`;
          const getTodo = await db.all(getTodoQuery);
          response.send(getTodo.map((each) => convertObj(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case ifCategoryAndPriorityGiven(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `SELECT * FROM todo 
                WHERE
                    todo LIKE '%${search_q}%'
                    AND category = '${category}'
                    AND priority = '${priority}';`;
          const getTodo = await db.all(getTodoQuery);
          response.send(getTodo.map((each) => convertObj(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case ifCategoryGiven(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
                SELECT * FROM todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND category = '${category}';`;
        const getTodo = await db.all(getTodoQuery);
        response.send(getTodo.map((each) => convertObj(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case ifPriorityGiven(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
                SELECT * FROM todo
                WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
        const getTodo = await db.all(getTodoQuery);
        response.send(getTodo.map((each) => convertObj(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case ifStatusGiven(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
                SELECT * FROM todo
                WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
        const getTodo = await db.all(getTodoQuery);
        response.send(getTodo.map((each) => convertObj(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    default:
      getTodoQuery = `
            SELECT * FROM todo
            WHERE 
            todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((each) => convertObj(each)));
  }
});
//API-2//
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getStates = `SELECT * FROM todo WHERE id = ${todoId};`;
  const states = await db.get(getStates);
  response.send(convertObj(states));
});
//API-3//
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const reqDate = isMatch(date, "yyyy-MM-dd");
  if (reqDate) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const dateQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const dateResult = await db.all(dateQuery);
    response.send(dateResult.map((each) => convertObj(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API-6//
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `DELETE FROM todo
   WHERE id = ${todoId};`;
  const result = await db.get(deleteTodo);
  response.send("Todo Deleted");
});
//API-4//
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const insertTodo = `
                    INSERT INTO
                    todo (id, todo, priority, status, category, due_date)
                    VALUES
                    (
                    "${id}",
                    "${todo}",
                    "${priority}",
                    "${status}",
                    "${category}",
                    "${newDueDate}"
                    );`;
          const todoAddition = await db.run(insertTodo);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});
//api-5//
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateItem = "";
  const requestItem = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    case requestItem.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
            UPDATE todo SET todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
            WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestItem.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
            UPDATE todo SET todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
            WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestItem.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
            UPDATE todo SET todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
            WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestItem.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
            UPDATE todo SET todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
            WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;

    case requestItem.todo != undefined:
      updateTodoQuery = `
            UPDATE todo SET todo= '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
            WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

module.exports = app;
