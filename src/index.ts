import { Hono } from 'hono'
import { cors } from 'hono/cors';


type Users ={
  id:number;
  username:string;
  email:string;
  password:string;
  created_at:string;
}

type Password={
  id:number;
  title:string;
  username:string;
  password:string;
  url:string;
  notes:string;
  user_id:number;

}

type Bindings={
  DB:D1Database;

}

const app = new Hono<{Bindings:Bindings}>()

app.use(
  '/*',
  cors({
    origin: 'http://localhost:5173/',
    allowMethods: ['POST', 'GET', 'OPTIONS','DELETE'],
  
  })
)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})


//get all details of the user

app.get('/users/get-all',async(c)=>{
  const users =await c.env.DB.prepare('SELECT * FROM users').all()
  return c.json(users);
})


//get all details of the passwords tablle
app.get('/pwd/get-all',async(c)=>{
  const pwd =await c.env.DB.prepare('SELECT * FROM passwords').all()
  return c.json(pwd);
})


//Specific password details
app.get('pwd/get-all/:id', async (c) => {
  const id = c.req.param('id');
  const pwd = await c.env.DB.prepare('SELECT * FROM passwords WHERE id = ?').bind(id).run();
  return c.json(pwd);
})

//POST elememts into the table

//user table posting

app.post('/users/new',async(c)=>{
 const {username,email,password} = await c.req.json();
 const currentTimestamp = new Date().toISOString();
  const {success} = await c.env.DB.prepare('INSERT INTO users (username,email,password,created_at) VALUES (?,?,?,?)').bind(username,email,password,currentTimestamp).run();

if(success){
  return c.json({ message: "User added successfully" });
}
else{
  return c.text("User not added");
}

})

//Password table posting

app.post('/pwd/new/:id', async(c) => {
  try {
    const user_id = c.req.param('id');
    const { title,username, password, url, notes} = await c.req.json();

    const { success } = await c.env.DB.prepare('INSERT INTO passwords (title,username, password, url, notes, user_id) VALUES (?,?,?,?,?,?)').bind(title,username, password, url, notes, user_id).run();

    if (success) {
      return c.json({ message: "Password added successfully" });
    } else {
      return c.json({ message: "Password not added" });
    }
  } catch (error: any) {
    return c.json({ error: error.toString() });
  }
});


//foreign key constraint

app.get('/pwd/get-id/:uid', async (c) => {
  try {
    // const userId = 1; // Assuming you want to retrieve information for user ID 1
     const userId = c.req.param('uid');
    const result = await c.env.DB.prepare(`
      SELECT *
      FROM passwords
      WHERE user_id = ?
    `).bind(userId).run();

    if (result) {
      return c.json({result});
    } else {
      return c.json({ error: 'User not found' }, 404);
    }
  } catch (error:any) {
    console.error('Error:', error);
    return c.text(error);
  }
});


// Search the vault

app.get('/pwd/sql/allsearch',async (c)=>{
  const query =  c.req.query('search') 

  const password = await c.env.DB.prepare('SELECT * FROM passwords WHERE title LIKE ?').bind(`%${query}%`).all();
  return c.json(password);
})

//To update the saved passwords

app.put('/pwd/update/:id', async (c) => {
  const id = c.req.param('id');
  const { title, username, password, url, notes } = await c.req.json();
  const { success } = await c.env.DB.prepare('UPDATE passwords SET title = ?, username = ?, password = ?, url = ?, notes = ? WHERE id = ?').bind(title, username, password, url, notes, id).run();

  if (success) {
    return c.json({ message: "Password updated successfully" });
  } else {
    return c.json({ message: "Password not updated" });
  }
})

//To delete the saved passwords

app.delete('/pwd/delete/:id', async (c) => {
  const id = c.req.param('id');
  const { success } = await c.env.DB.prepare('DELETE FROM passwords WHERE id = ?').bind(id).run();

  if (success) {
    return c.json({ message: "Password deleted successfully" });
  } else {
    return c.json({ message: "Password not deleted" });
  }
})

//login route

app.post('/user-auth',async (c)=>{

  try{
    const {username,password} = await c.req.json();

    const statement = c.env.DB.prepare('SELECT id FROM users WHERE username = ? AND password = ?');
    const result = await statement.bind(username,password).all(); 
    const ans = result.results.length;
    if(ans==1){
      return c.json(result);
    }else{
      return c.json("not logged in")
    }
  }
  catch (error:any){
       console.log(error);
  }

  // const user = await c.env.DB.prepare('SELECT id FROM users WHERE username = ? AND password = ?').bind(username,password).all();
  // return c.json(user);
})

export default app
