# Origami Love 📄❤️

**One sheet of paper folds itself into love.**
A flat paper square on a lamp-lit desk folds itself into an origami crane, the crane flies and lands, then unfolds and refolds into a paper heart. Tiny paper hearts fall like confetti, the heart opens like a card with a handwritten note inside, and finally hundreds of little paper hearts gather into one big glowing heart.

🔗 **Live demo:** https://origami-hackncode.sites.tab.bot/

Day 7 of my **100 Days of Code Reels** challenge, by [@hack.n.code](https://instagram.com/hack.n.code).

## ✨ Scenes
1. Tap to fold
2. A flat sheet of red origami paper drops onto the desk
3. Real folds: diagonal fold, then half fold (each flap rotates around its crease)
4. The folded paper becomes an origami **crane** 🕊️
5. The crane flaps its wings, flies a little and lands
6. It unfolds back into a square and refolds into a **heart** ❤️
7. Folded paper hearts fall like confetti
8. The heart opens like a card: *"Every fold of my heart leads to you"*
9. Finale: paper hearts arrange into one big glowing heart

## 🛠️ How it works
- **No libraries.** Plain HTML, CSS and JavaScript with Canvas 2D.
- A tiny hand-written **3D engine**: the sheet is cut into 24 triangular facets along its fold lines; each facet is transformed in 3D, projected with a perspective camera and depth-sorted.
- **Folds** are true rotations of the facets around the crease lines; shape changes morph each facet to its place in the crane and heart.
- **Lighting**: per-facet Lambert + specular shading; the paper is red on one side and cream on the other, so you see the back of the paper when a flap flips.
- **Paper texture** is mapped onto every facet with an affine transform, so the fibres stay glued to the paper while it folds.
- **Soft shadows** are projected onto the desk from the lamp and blurred by height.
- **Sound**: paper rustles and chimes synthesised with the Web Audio API.

## 💌 Make it yours
Add a name to the link and it's written inside the heart:
```
https://origami-hackncode.sites.tab.bot/?name=YourPerson
```
(by default no name is shown)

## 📁 Files
- `index.html`: layout and buttons
- `style.css`: big, phone-first UI
- `app.js`: 3D paper engine, the scenes, sound

Made with ❤️ by **@hack.n.code**
