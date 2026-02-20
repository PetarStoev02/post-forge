# Project Conventions

## TypeScript Rules

1. **Arrow Functions**: Always use arrow function syntax
   ```typescript
   // ✅ Good
   const MyComponent = () => { }
   const handleClick = () => { }

   // ❌ Bad
   function MyComponent() { }
   function handleClick() { }
   ```

2. **Type vs Interface**: Always use `type` instead of `interface`
   ```typescript
   // ✅ Good
   type UserProps = {
     name: string
     age: number
   }

   // ❌ Bad
   interface UserProps {
     name: string
     age: number
   }
   ```
