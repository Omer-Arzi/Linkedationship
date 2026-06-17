import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function FoodOrders({ values }) {
  const [selected, setSelected] = useState(new Set());
  const [orders, setOrders] = useState([]);

  function handleClick(item) {
    if (!selected.has(item)) {
      setSelected(prev => new Set(prev).add(item));
    }
  }

  function onListAdd() {
    if (selected.size === 0) return;
    setOrders(prev => [...prev, Array.from(selected)]);
    setSelected(new Set());
  }

  return (
    <div>
      <div>
        {values.map((item, index) => (
          <span key={index}
            className={selected.has(item) ? "selected" : ""}
            onClick={() => handleClick(item)}>
            {item}
          </span>
        ))}
      </div>
      <button onClick={onListAdd}>Add to List</button>
      <ol>
        {orders.map((order, index) => (
          <li key={index}>
            {order.map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </li>
        ))}
      </ol>
    </div>
  );
}

const style = `
span {
  display: inline-block;
  min-height: 25px;
  min-width: 25px;
  border: 1px solid black;
  margin: 5px;
  text-align: center;
  cursor: pointer;
}
.selected {
  background-color: yellow;
}
`;

const styleElement = document.createElement("style");
styleElement.textContent = style;
document.head.appendChild(styleElement);

document.body.innerHTML = "<div id='root'></div>";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<FoodOrders values={["Burger", "Pizza", "Salad", "Noodles", "Pasta"]} />);
