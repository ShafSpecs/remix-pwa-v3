import { json } from '@remix-run/node'
import { useLoaderData } from 'react-router';
import { Link } from '@remix-run/react'


export async function loader() {
  const date = new Date()
  
  return json({
    time: `${date.getMinutes()}:${date.getSeconds()}`
  })
}


export default function Bar() {
  const { time } = useLoaderData()

  return (
    <div>
      <h1>Welcome to Bar</h1>
      <h2>The time is: {time}</h2>
      {/* <img src="/images/car-1.jpg" alt="Car" style={{ width: "400px" }} /> */}
      <Link to='/'>Goto Home</Link>
    </div>
  );
}