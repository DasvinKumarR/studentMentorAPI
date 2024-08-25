// importing express
import express from "express"
// importing mongoose
import mongoose from "mongoose";
// importing  body parse 
import bodyParser from "body-parser"
// import dotenv
import dotenv from "dotenv"
// creating instance for express
const app = express();
// parsing input body into json
app.use(bodyParser.json());
// initializing environment file
dotenv.config();
// creating variable to hold db atlas URL
const dbURL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.u39yc.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0`;
// code to connect with DB
mongoose.connect(dbURL)
.then(() => {console.log("DB connected successfully")})
.catch((error) => console.log(error));
// creating model for mentors
const mentorSchema = new mongoose.Schema({
    name: String,
    students:[{type: mongoose.Schema.Types.ObjectId, ref:'Student'}]
});
// creating schema for students
const studentSchema = new mongoose.Schema({
    name: String,
    mentor:{type: mongoose.Schema.Types.ObjectId, ref: 'Mentor'},
    previousMentors: [{type: mongoose.Schema.Types.ObjectId, ref: 'Mentor'}]
});
// creating variable to  refer to created mentor and student schema
const Mentor = mongoose.model('Mentor', mentorSchema);
const Student = mongoose.model('Student', studentSchema);
// creating POST request to  create mentor
app.post('/mentors', async(req, res) => {
    try{
        const mentor = new Mentor(req.body);
        await mentor.save();
        res.status(201).send({
            message:"Mentor created successfully",
            data: mentor
        })
    }catch(error){
        res.status(400).send({error: error.message});
    }
});
// creating POST request to create students
app.post('/students', async(req, res) => {
    try{
        const student = new Student(req.body);
        await student.save();
        res.status(201).send({
            message: "student created successfully",
            data: student
        })
    }catch(error){
        res.status(400).send({error: error.message})
    }
});
// creating post request to assign student to mentor
app.post('/mentors/:mentorId/students/:studentId', async(req, res) => {
    try{
        const mentor = await Mentor.findById(req.params.mentorId);
        const student = await Student.findById(req.params.studentId);
        if(student.mentor) {
            return res.status(400).send('Student already has a mentor');
        }
        student.mentor = mentor._id;
        await  student.save();
        mentor.students.push(student._id);
        await mentor.save();
        res.status(200).send({
            message: "student assigned successfully",
            data: mentor
        })
    }catch(error){
        res.status(400).send({error: error.message})
    }
});
// creating put request to reassigning mentor for student
app.put('/students/:studentId/mentor/:mentorId', async (req, res) => {
    try{
        const student = await Student.findById(req.params.studentId);
        const newMentor = await Mentor.findById(req.params.mentorId);
        if(student.mentor){
            const oldMentor = await Mentor.findById(student.mentor);
            oldMentor.students.pull(student._id);
            await oldMentor.save();
            student.previousMentors.push(student.mentor);
        }
        student.mentor = newMentor._id;
        await student.save();
        newMentor.students.push(student._id);
        await newMentor.save();
        res.status(200).send({
            message: "mentor changed successfully",
            data: student
        });
    }catch(error){
        res.status(400).send({error: error.message});
    }
});
// creating request to all students for specific mentor
app.get('/mentors/:mentorId/students', async(req, res) => {
    try{
        const mentor = await Mentor.findById(req.params.mentorId).populate('students');
        res.status(200).send(mentor.students);
    }catch(error){
        res.status(400).send({error: error.message});
    }
});
// creating request to display previous mentor for the specified students
app.get('/students/:studentId/previous-mentors', async(req, res) => {
    const student = await Student.findById(req.params.studentId).populate('previousMentors');
    res.status(200).send(student.previousMentors);
});
// setting up server to listen port
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server is listening to port ${port}`)
})