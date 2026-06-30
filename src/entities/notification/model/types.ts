export type PlayerNotification = { id:string; type:"Registration"|"Waitlist"|"Promotion"|"Reminder"|"Cancellation"; title:string; message:string; createdAt:string; tournamentId?:number };
