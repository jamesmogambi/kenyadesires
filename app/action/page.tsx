import { sql } from '@/app/lib/db';
import { revalidatePath } from 'next/cache';
import { connection } from 'next/server';

export default async function ActionPage() {
  async function createComment(formData: FormData) {
    'use server';
    const comment = formData.get('comment') as string;
    await sql`INSERT INTO comments (comment) VALUES (${comment})`;
    revalidatePath('/action');
  }

  async function getComments() {
    await sql`CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, comment TEXT)`;
    const comments = await sql`SELECT * FROM comments`;
    return comments;
  }

  await connection();

  return (
    <div>
      <h2>Server Action Example</h2>
      <form action={createComment}>
        <input type="text" name="comment" placeholder="Add a comment" />
        <button type="submit">Submit</button>
      </form>
      <h3>Comments:</h3>
      <ul>
        {await getComments().then((comments) =>
          comments.map((c: any) => <li key={c.id}>{c.comment}</li>)
        )}
      </ul>
    </div>
  );
}
