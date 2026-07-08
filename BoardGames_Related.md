# Objective

This file consists of descriptions of all controllers&endpoints that are linked to Boardgames management in MeepleHub API

## BoardGamesController

### Endpoint:

- GET `/api/boardgames`
  - a public endpoint to list all games registered on the platform (local db)

Query parameters:

- `?search=Catan` - searches a game by name
- `?page=1&pageSize=50`
- `?categoryIds=1` - filters games by category (Economic,Strategic...)
- GET `?players=4` - matches against : MinPlayers <=4 AND MaxPlayers >=4
- GET `?sortBy=rank&sortDirection=asc` - sorts the boardgames by rank (asc by default)

### Endpoint:

- GET `/api/boardgames/categories`
  - a public endpoint to list all categories of boardgames registered on the platform

### Endpoint:

- GET `/api/boardgames/{id}`
  - a public endpoint to get a detailed info of a specified game with the given Id

### Endpoint:

- GET `api/boardgames/bgg-search?bggid`
  - [MustBeClubAdmin]
  - this endpoint is called to fetch the detailed info about a game from bgg API directly, when club admin searches for a new game to add to a catalog

### Endpoint:

- POST `/api/boardgames/bgg-search`
- [MustBeClubAdmin]
- Request Body:

```json
"Keyword": "Dominion"
```

- fetches from bgg directly
- flow : a button [Add new boardgame to your catalog] is clicked on, club admin types boardgame title (Minimum 3 characters validation) and clicks on search icon. That is when this endpoint is called. Internally we call https://boardgamegeek.com/xmlapi2//search?query=Dominion&type=boardgame - this endpoint of bgg API and show club admin all returned games. When admin clicks on a specific boardgame out of the list returned,to show him the details of that game first as a pop up, we call `api/boardgames/bgg-search?bggid` - internally we call the `thing` endpoint of bgg API with that bggId. here in UI user will have add and cancel buttons. if club admin clicks on Add button - `/api/clubs/{id}/games` is called.

## ClubsController

Club's Game-Inventory Discovery:

### Endpoint:

- GET `/api/clubs/{id}/boardgames`
  - a public endpoint to get the games list that this specific club is in posession of

Query Parameters:

http://localhost:8082/api/clubs/3/boardgames?page=1&pageSize=100

- `?search=Catan`
- `?page=1&pageSize=10`

Club's Game-Inventory Management:

### Endpoint:

- POST `/api/clubs/{id}/games`
  - [MustBeClubAdmin]
  - for a club admin to add a new game to their catalog
  - we check here, if this boardgame already exists in local db: if yes - it gets added in junction table automatically, if not - we fetch from bgg (if we don;t have it cached already)

- Request Body :

```json
{
  "BggGameId": 13
}
```

### Endpoint:

- DELETE `/api/clubs/{id}/games/{gameId}`
  - an endpoint for club admin to remove a game from their catalog
  - hard delete
