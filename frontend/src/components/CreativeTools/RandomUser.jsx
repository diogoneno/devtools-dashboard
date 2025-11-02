import { useState } from 'react';
import '../ToolLayout.css';

const RandomUser = () => {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(1);

  const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Emma', 'Robert', 'Olivia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Park Ave', 'Washington Blvd', 'Lake St', 'Hill Rd'];

  const generateRandomUser = () => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];

    return {
      id: Math.random().toString(36).substr(2, 9),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      age: Math.floor(Math.random() * 60) + 18,
      address: {
        street: `${Math.floor(Math.random() * 9999) + 1} ${street}`,
        city,
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
      },
      username: `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`
    };
  };

  const generate = () => {
    const newUsers = [];
    for (let i = 0; i < count; i++) {
      newUsers.push(generateRandomUser());
    }
    setUsers(newUsers);
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(users, null, 2));
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Random User Generator</h1>
        <p>Generate fake user data for testing</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Number of Users: {count}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <button className="btn btn-primary" onClick={generate}>
          Generate Users
        </button>

        {users.length > 0 && (
          <>
            <div className="result-box">
              {users.map((user, idx) => (
                <div key={user.id} style={{
                  background: idx % 2 === 0 ? '#f8f9fa' : 'white',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '5px',
                  border: '1px solid #dee2e6'
                }}>
                  <h4 style={{ marginTop: 0 }}>{user.fullName}</h4>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Phone:</strong> {user.phone}</p>
                  <p><strong>Age:</strong> {user.age}</p>
                  <p><strong>Address:</strong> {user.address.street}, {user.address.city} {user.address.zipCode}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                </div>
              ))}
            </div>

            <div className="result-box">
              <h4>JSON Export</h4>
              <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(users, null, 2)}
              </pre>
            </div>

            <button className="btn btn-success" onClick={copyJSON}>
              Copy JSON
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RandomUser;
