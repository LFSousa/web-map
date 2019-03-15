let {Structure, Endpoints} = require('./');

/*

Steps:

Using the initial values: array_index = 2

1 - Make a GET request to http://dummy.restapiexample.com/api/v1/employees 
    and map the id of [{{array_index}}] element from the response array into emp_id

2 - Make a GET request to http://dummy.restapiexample.com/api/v1/employee/{{emp_id}}
    where the {{emp_id}} is the value extracted from the previous request
    and map the employee info into new parameters

3 - Map the parameters extracted into a new structure

*/

let endpoints = new Endpoints(
    [
        {
            'uri': "http://dummy.restapiexample.com/api/v1/employees",
            'method': "get",
            'params': {
                "emp_id": "[{{array_index}}][id]"
            }
        },

        {
            'uri': "http://dummy.restapiexample.com/api/v1/employee/{{emp_id}}",
            'method': "get",
            'params': {
                "emp_name": "[employee_name]",
                "emp_sal": "[employee_salary]",
                "emp_age": "[employee_age]"
            }
        }
    ]
)

let struct = new Structure({
    employee: "{{emp_name}} ({{emp_age}})",
    sal: "${{emp_sal}}"
})

endpoints.extractParams({array_index: 2}).then(params => {
    console.log(struct.fill(params).filled);
});