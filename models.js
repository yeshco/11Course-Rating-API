// Require Sequelize
const {Sequelize, DataTypes} = require('sequelize')

// create object with a relation to the Sequelize Object (Instance) and pass parameters specific to your db
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './fsjstd-restapi.db'
})
    
    // create Models (Class Extension) -->

    // define User Model
    const User = sequelize.define('User', {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        }, 
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        emailAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notNull: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
    })

    // define Course Model
    const Course = sequelize.define('Course', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: User,
                key: 'id'
            }
        }, 
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        estimatedTime: {
            type: DataTypes.STRING
        },
        materialsNeeded: {
            type: DataTypes.STRING,
        },
    })

    // define Associations
    User.hasMany(Course);
    Course.belongsTo(User);

    
// export sequelize
module.exports = sequelize