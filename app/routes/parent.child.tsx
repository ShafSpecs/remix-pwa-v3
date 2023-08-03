import { json } from '@remix-run/node'
import { useLoaderData } from 'react-router';
import { Link } from '@remix-run/react'


export async function loader() {
    const date = new Date()
    
    return json({
      time: `${date.getMinutes()}:${date.getSeconds()}`
    })
  }


export default function Child() {
  const { time } = useLoaderData()

  return (
    <div>
      <h1>Welcome to Child</h1>
      <h2>The time is: {time}</h2>
      <img src="/images/car-2.jpg" alt="Car" style={{ width: "400px" }} />
      <Link to='/parent'>Goto Parent</Link>
    </div>
  );
}