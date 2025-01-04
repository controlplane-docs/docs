# Components

## Accordions
A dropdown component to toggle content

### Example

```jsx
<Accordion title="I am an Accordion.">
  You can put any content in here.
</Accordion>
```

### Props

- title (string, required)
  - Title in the Accordion preview.

- description (string)
  - Detail below the title in the Accordion preview.

- defaultOpen (boolean)
  - Whether the Accordion is open by default.

- icon (string or svg)
  - A Font Awesome icon or SVG code

- iconType (string)
  - One of “regular”, “solid”, “light”, “thin”, “sharp-solid”, “duotone”, or “brands”

## Accordion Groups
Group multiple accordions into a single display.

Simply add <AccordionGroup> around your existing <Accordion> components.

```jsx
<AccordionGroup>
  <Accordion title="FAQ without Icon">
    You can put other components inside Accordions.

    ```java HelloWorld.java
    class HelloWorld {
        public static void main(String[] args) {
            System.out.println("Hello, World!");
        }
    }
    ```

  </Accordion>

  <Accordion title="FAQ with Icon" icon="alien-8bit">
    Check out the [Accordion](/content/components/accordions) docs for all the supported props.
  </Accordion>

  <Accordion title="FAQ without Icon">
    Check out the [Accordion](/content/components/accordions) docs for all the supported props.
  </Accordion>
</AccordionGroup>
```

## Callout Boxes
Use callouts to add eye-catching context to your content

### Note Callouts

```jsx
<Note>This adds a note in the content</Note>
```

### Warning Callouts

```jsx
<Warning>This raises a warning to watch out for</Warning>
```

### Info Callouts

```jsx
<Info>This draws attention to important information</Info>
```

### Tip Callouts

```jsx
<Tip>This suggests a helpful tip</Tip>
```

### Check Callouts

```jsx
<Check>This brings us a checked status</Check>
```

## Cards

Highlight main points or links with customizable icons

### Horizontal Card

Add a horizontal property to a card to make it horizontally displayed.

### Image Card

Add an img property to a card to display an image on the top of the card.

### Card Example

```jsx
<Card title="Click on me" icon="link" href="/content/components/card-group">
  This is how you use a card with an icon and a link. Clicking on this card
  brings you to the Card Group page.
</Card>
```

### Image Card Example

```jsx
<Card title="Image Card" img="/images/card-with-image.png">
  Here is an example of a card with an image
</Card>
```

### Props

- title (string, required)
  - The title of the card

- icon (string or svg)
  - A Font Awesome icon or SVG code in icon={}

- iconType (string)
  - One of regular, solid, light, thin, sharp-solid, duotone, brands

- color (string)
  - The color of the icon as a hex code

- href (string)
  - The url that clicking on the card would navigate the user to

- horizontal (boolean)
  - Makes the card more compact and horizontal

- img (string)
  - The url or local path to an image to display on the top of the card

## Card Groups
Show cards side by side in a grid format

The CardGroup component lets you group multiple Card components together. It’s most often used to put multiple cards on the same column.

```jsx
<CardGroup cols={2}>
  <Card title="First Card" icon="square-1">
    Neque porro quisquam est qui dolorem ipsum quia dolor sit amet
  </Card>
  <Card title="Second Card" icon="square-2">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit
  </Card>
  <Card title="Third Card" icon="square-3">
    Ut enim ad minim veniam, quis nostrud exercitation ullamco
  </Card>
  <Card title="Fourth Card" icon="square-4">
    Excepteur sint occaecat cupidatat non proident
  </Card>
</CardGroup>
```


### Props

- cols (number, default: 2)
  - The number of columns per row

## Code Blocks
Display code with optional syntax highlighting

​
### Basic Code Block
Use fenced code blocks by enclosing code in three backticks.

```md
"```javascript (without " characters in real case)
const hello = "world";
```"
```

### Syntax Highlighting
Put the name of your programming language after the three backticks to get syntax highlighting.

We use Prism for syntax highlighting. Test Drive Prism lists all the languages supported.

```
"```java
class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```"
```

### Names
You can add more text after the programming language to set the name of your code example. The text can be anything as long as its all in one line.

```jsx
"```javascript Code Block Example
const hello = "world";
```"
```

### Line Highlighting
You can highlight specific lines in your code blocks by adding a special comment after the language identifier. Use curly braces {} and specify line numbers or ranges separated by commas.

```jsx
"```javascript Line Highlighting Example {1,3-5}
const greeting = "Hello, World!";
function sayHello() {
  console.log(greeting);
}
sayHello();
```"
```

## Code Groups
The CodeGroup component lets you combine code blocks in a display separated by tabs

You will need to make Code Blocks then add the <CodeGroup> component around them. Every Code Block must have a filename because we use the names for the tab buttons.

```jsx
<CodeGroup>

"```javascript helloWorld.js
console.log("Hello World");
```"

"```python hello_world.py
print('Hello World!')
```"

"```java HelloWorld.java
class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```"

</CodeGroup>
```

## Steps
Sequence content using the Steps component

Steps are the best way to display a series of actions of events to your users. You can add as many steps as desired.

```jsx
<Steps>
  <Step title="First Step">
    These are instructions or content that only pertain to the first step.
  </Step>
  <Step title="Second Step">
    These are instructions or content that only pertain to the second step.
  </Step>
  <Step title="Third Step">
    These are instructions or content that only pertain to the third step.
  </Step>
</Steps>
```

### Steps Props

- children (ReactElement<StepProps>[])
  - A list of Step components.

- titleSize (string, default: "p")
  - The size of the step titles. One of p, h2 and h3.

### Individual Step Props

- children (string | ReactNode, required)
  - The content of a step either as plain text, or components.

- icon (string or svg)
  - A Font Awesome icon or SVG code in icon={}

- iconType (string)
  - One of regular, solid, light, thin, sharp-solid, duotone, brands

- title (string)
  - The title is the primary text for the step and shows up next to the indicator.

- stepNumber (number)
  - The number of the step.

- titleSize (string, default: "p")
  - The size of the step titles. One of p, h2 and h3.

## Tabs
Toggle content using the Tabs component

You can add any number of tabs.

```jsx
<Tabs>
  <Tab title="First Tab">
    ☝️ Welcome to the content that you can only see inside the first Tab.
  </Tab>
  <Tab title="Second Tab">
    ✌️ Here's content that's only inside the second Tab.
  </Tab>
  <Tab title="Third Tab">
    💪 Here's content that's only inside the third Tab.
  </Tab>
</Tabs>
```

### Tab Props

- title (string, required)
  - The title of the tab. Short titles are easier to navigate.
