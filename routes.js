'use strict';

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('./middleware/auth-user');
const { asyncHandler } = require('./middleware/async-handler');
const { User, Course } = require('./models');


// Rouote that returns the current authenticated user.
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const user = req.currentUser;
  
    res.json({
      id: user.id,
      firstname: user.firstName,
      lastname: user.lastName,
      username: user.emailAddress,
      password: user.password,
      createAt: user.createdAt,
      updateAt: user.updatedAt
    });
  }));

// Route that creates a new user.
router.post('/users', asyncHandler(async (req, res) => {
    try {
      await User.create(req.body);
      // Set the Location Header
      res.location('/');      
      // Return a 201 HTTP status code with no content
      res.status(201).send();
    } catch (error) {
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const errors = error.errors.map(err => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  }));

  // Route that return all courses including the User associated 
  router.get('/courses', asyncHandler( async (reg,res) => {
    const courses = await Course.findAll({
      include: [
        {
          model: User, 
          as: 'user',      
        }
      ]
    });
    res.json(courses);
  }));

  // Route that will return the corresponding course including the User associated
  router.get('/courses/:id', asyncHandler( async (req,res) => {
    const courseID = req.params.id;
    const course = await Course.findByPk(courseID, {
      include: [
        {
          model: User, 
          as: 'user',      
        }
      ]
    });
    if (course){
    res.json(course);
    } else {
       res.status(404).json({ "message": "Course not found!" });
    }
  }));

  // Route that creates a new course.
  router.post('/courses', authenticateUser,asyncHandler(async (req, res) => {
    try {
      //console.log(req.body.title);
      const title = req.body.title;
      const description = req.body.description;
      const userId = req.body.userId;
      await Course.create(req.body);
      //Select a course ID from the new course
      const course = await Course.findOne({
        attributes: ["id"],
        where: {
          title: title,
          description: description,
          userID: userId,
        },
        order: [["createdAt", "DESC"]],
      });
      if (course) {
        // Set the Location header to the URI of the newly created course
        res.location(`/courses/${course.id}`);
        // Return a 201 HTTP status code with no content
        res.status(201).send();
      }
    } catch (error) {
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const errors = error.errors.map(err => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  }));

  // Route that will update the corresponding course
  router.put('/courses/:id', authenticateUser, asyncHandler( async (req, res) => {
    const courseID = req.params.id;
    const { title, description } = req.body;

    if ( !title || !description) {
      return res.status(400).json({ 
        error: 'Title and description are required.' 
      });
    }

    try {
      await Course.update(req.body, {
        where: {
          id: courseID
        }
      });
      res.status(204).json({ "message": "Course successfully updated!" });
    } catch (error) {
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const errors = error.errors.map(err => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  }));

    // Route that will delete the corresponding course
    router.delete('/courses/:id', authenticateUser ,asyncHandler( async (req, res) => {
      const courseID = req.params.id;
      try {
        await Course.destroy({
          where: {
            id: courseID
          }
        });        
        res.status(204).json({ "message": "Course successfully deleted!" });
      } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
          const errors = error.errors.map(err => err.message);
          res.status(400).json({ errors });
        } else {
          throw error;
        }
      }
    }));

  
  module.exports = router;

