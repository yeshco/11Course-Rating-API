// load npm modules -->
const express = require('express')
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// load private modules -->
const sq = require('./models');

// create router object to export -->
const router = express.Router();

// 2 functions used in the routes -->

// error handler function for the routes
function gErrorHandler(cb) {
    return async (req, res, next) => {
      try {
        await cb(req, res, next)
      } catch (e) {
        // if error is a sequelize validation or constraint(unique) send 400(Bad Request) status code
        if (e.name == "SequelizeValidationError" || "SequelizeUniqueConstraintError") {
            let errorArray = [];
            for (let i=0; i<e.errors.length; i++) {
            errorArray.push(e.errors[i].message)
        }
            res.status(400).send(errorArray)
        // if error is anything else send 500(Internal Server Error) status code
        } else { 
            res.status(500).send('ERROR: ' + e.message)
        }
      }
    }
  }
  
  // function to check authentication
  async function userAuthentication(req, res, next) {
    let message = null

    // parse authentication headers with auth module
    const credentials = auth(req);

    // super long if statement to check all steps of authentication -->

    // if header exists
    if (credentials) {
    
        // get user trying to access, get course being accessed
        const user = await sq.models.User.findOne({ where: { emailAddress: credentials.name } });
        const course = await sq.models.Course.findByPk(req.params.id)

      // function used to check if user exists and sometimes to check it matches the course being changed
      function checkParam() {
        // if course being accessed -> compare user to course
        if (req.params.id) {
            if (user.id === course.userId) {
                return true
            // if there's no match send 403(Forbidden) status code
            } else {
                res.status(403).send(`User: ${credentials.name} not authorized`)
                return false
            }
        // if user being accessed check if user exists
        } else if (user) {
            return true
        } else {
            return false
        }
      }

      // if user exists and course matches (if it has to) -> compare passwords
        if (checkParam()) {
            const passed = bcryptjs.compareSync(credentials.pass, user.password);

            // if authentication passed -> set a currentUser object with user data
            if (passed) {
            req.currentUser = {firstName: user.firstName, lastName: user.lastName, emailAddress: user.emailAddress}
            // req.currentUser = (({firstName, emailAddress}) => ({firstName, emailAddress}))(user)
            } else {
                // if password authentication failed
                message = `Authentication failure for username: ${user.emailAddress}`;
            }
        } else {
            // if user not found
            message = `User: ${credentials.name} not found`;
        }
    } else {
        // if authentication headers not found
        message = 'Auth header not found';
    }
  
    // if message has an error message send 401(Unauthorized client error) status code
    if (message) {
      res.status(401).send(message)

    // if no error was found continue to next middleware function
    } else {
        next()
    }
  }
  
// 7 routes -->
// 2 users routes -->

// get route -> 1) authenticate the user  2) send back the current user in JSON
router.get(`/users`, userAuthentication, gErrorHandler(async (req, res) => {
    res.json(req.currentUser);
}))
  
// post route -> 1) if password was found hash it  2) create entry in database  3) redirect to main --???  4) send back 201(Created) status code
router.post(`/users`, gErrorHandler(async (req, res) => {
    if (req.body.password) {
        req.body.password = bcryptjs.hashSync(req.body.password);
    }
    await sq.models.User.create(req.body);
    res.set('Location', '/')
    res.status(201).end()
}))
  
// 5 courses routes -->

// get all courses route -> 1) filter the results  2) send back all courses in JSON
router.get(`/courses`, gErrorHandler(async (req, res) => {
    const courses = await sq.models.Course.findAll({
        attributes: {exclude: ['createdAt', 'updatedAt']}
    });
    res.json(courses)
}))
  
// get specific course route -> 1) filter results  2) if course is found send JSON, else: no route found
 router.get(`/courses/:id`, gErrorHandler(async (req, res, next) => {
    const course = await sq.models.Course.findByPk(req.params.id, {
        attributes: {exclude: ['createdAt', 'updatedAt']}
    });
    if (course) {
        res.json(course)
    } else {
        next()
    }
}))
  
// post route -> 1) authenticate user exists  2) create entry on db  3) redirect to main--???  4) send back 201(Created) status code
 router.post(`/courses`, userAuthentication, gErrorHandler(async (req, res) => {
    await sq.models.Course.create(req.body);
    res.set('Location', '/')
    res.status(201).end()
}))
  
// put route -> 1) authenticate user matches with course  2) check attribute to change exists  3) update db  4) send back 204(No Content) status code if everything was ok  5) send error if attributes didn't exist
router.put(`/courses/:id`, userAuthentication, gErrorHandler(async (req, res, next) => {
    const allAttributes = Object.keys(sq.models.Course.rawAttributes)
    const requestBody = Object.keys(req.body)
    let i;
    for (i=0; i<allAttributes.length; i++) {
        if (requestBody.includes(allAttributes[i])) {
            await sq.models.Course.update(req.body, {
              where: {
                id: req.params.id
              }
            });
            res.status(204).end()
            break;
        }
    }
    if (i == allAttributes.length) {
        next(new Error("Attributes weren't named correctly"))
    }
}))
  
// delete route -> 1) authenticate user matches with course  2) delete course in db  3) if course doesn't exist send back error: not found
router.delete(`/courses/:id`, userAuthentication, async (req, res, next) => {
    const course = await sq.models.Course.destroy({
        where: {
            id: req.params.id
        }
    });
  
    if (course != 0) {
        res.status(204).end()
    } else {
        next()
    }
})

// export router object with all routes -->
module.exports = router;