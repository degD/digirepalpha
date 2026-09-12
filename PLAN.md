
# digirepalpha!

Latest in the DigiRep series.
1. https://github.com/degD/digital-repertoire
2. https://github.com/degD/digirepx
3. https://github.com/degD/digirepx2
4. https://github.com/degD/digirepxyz
5. digirepalpha!

The scope of this project is minimal compared to previous iterations.
Build a simple tool that does the job, rather than building an 
incomplete tool that does not.

There will be three pages. The first page is the search page. There
is a search bar at the top (or bottom). It does fuzzy search of titles
and tags. As you search, a list of song items appear. The items
display title (in bold) and tags. They do not show any other information.

When you click on a song item, an editor opens up. It is a very simple
text editor. The user only sees the song text with chords in different
style or color. It is like ChordPro format except much simpler. The user
only edits the text like any other editor. However, can select a text
and press the `chordify` button to turn selection into a chord. No 
validation. Automatically selects the whole word when presses on a word.
When multiple words are selected, all are turned into chords. For example:

```
Em                Am
Pretend this is a poem
Em       G      Am     Em
Not on a random README
 Am         B7 
but on a web store
```

Is represented this way in my own format:

```
<Em>              <Am>
Pretend this is a poem
<Em>     <G>    <Am>   <Em>
Not on a random README
 <Am>       <B7> 
but on a web store
```

The user will basically be unable to enter `<` or `>`. Instead,
the user can only enter `&lt;` and `&gt;`. If the editor does
not support it, instead could listen for key-press events and
intercept the input. In case user enters `<`, will send `\<` 
instead. And when user tries to delete it, the editor backend
will remove both. Similar when user edits a chord. If tries 
to remove `m` from the `Em`, the backend could intercept it
and skip the `>` symbol. Basically, this representation of 
chords is not going to be different than any other word.
`<Asdfghjkl>` is a chord as much as `<Am7>` is. 

Chord selection is required for transposing to work correctly.
The editor will also have buttons for transposing forward and
backward. There will also be font size increment, decrement
buttons. Each change is saved automatically, therefore no save
button.

Song title and tags are selected from the editor. A button for
metadata. The title is a text field. Tags are a dropdown list
that one can also add items. Tags are case insensitive and
new tags are validated after entering them into new tag field.
Tags and titles are also saved automatically.

The search page will also have a `new song` button. When pressed,
it will ask for a title, with an alert box. This alert box has
no special importance than entering the title at editor. However
it would be convenient. There will be no title conflict, as each
song item will have a unique ID. There is nothing stops a user to
give multiple songs the same name.

The last page is called `Data`. It is for importing and exporting
song items. There will be two options:

1. Export: Export the whole song database as a single file in a 
custom format. Lets call it `db.songs`.
2. Import: For importing whole song databases, for files like
`db.song`. Essentially, the purpose of import and export is
backup.

There is no plan for single song imports and exports. The reason is,
the user can copy the text and share it, instead of relying a custom
format. Converting the song to a sharable format, like PDF, is also
beyond the scope of this app. However, a companion project will be 
designed for mass import and conversion of songs, from different
formats, including PDF, Word, even image files. 

There is no plan for cloud backup, as user can easily export the song
database and upload to a cloud provider. Providing a custom interface
like WebDAV requires a complex setup and it is hard to prevent conflict
edge cases. On the other hand, there is no way to finance a propriety
cloud backup service as this project is open source with no monetization.

There is a plan for cross platform usage of this app. It will be based
on Capacitor.js, for mobile operating systems. The main target is Android,
and iOS if a maintainer could be found. Later on, a backend like Electron
could be initialized to be a standalone desktop app. But the main development
will be on web.

Song items could be stored easily in a JSON database, as expected DB size
is quite limited. A single song item could be represented with this interface:

```typescript
SongItem {
  id: number;
  title: str;
  tags: str[];
  song: str;
}
```

For deleting a song, long press on the song item and select the 
`delete` button. To delete multiple songs, repeat. To delete all
og them, simply reinstall the app.

For development, Next.js is chosen for easier SPA development.
Astro is another great contender, but rejected because event 
state management is harder with MPAs. Tailwind CSS is chosen
for styling. `bun` will be used for project and package management.
Finally, Capacitor.js and a desktop bundler for cross platform
execution.


## v0.1 [COMPLETE]

Next.js installed. Develop search page demo with its buttons.

## v0.2 [COMPLETE]

SongItem and database. Storing on web uses localStorage.
Implement load and save functions and unit tests. 
SongData object is a list of SongData, and will hold
the song store. Run tests with `bun test`.

## v0.3 [COMPLETE]

Add test SongItems to DB and display make search work.
DB is hardcoded for demo purposes.

## v0.4 [COMPLETE]

Make tapping on SongItem open an empty text editor page.
Display title and tags on editor page, and dislpay a `back`
button. Add scrolling to search page SongItem list.

## v0.5 [COMPLETE]

Editor buttons and autosave. Transpose buttons are
disabled. Font size buttons work. DB seeding only concludes
if DB is empty. Font size range is 12px to 32px, starting at 
16px.

## v0.6

Custom chord format. Custom editor. Tests.
