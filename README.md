# Group Project

## Project Overview
This is a React application developed collaboratively by our team. Follow the instructions below to set up and run the project.

## Getting Started

### 1. Navigate to the Project Directory
Make sure you are in the root folder of the project.

### 2. Open the terminal
Open the terminal and run the command below:

```sh
docker compose up --build
```

### 2. Run the Application
Start the application by control + clicking the link:

![Link to click](./assets/Screenshot%202025-02-25%20164421.png)

The application should now be running at [http://localhost:5173](http://localhost:5173).


### 3. Changing .sh files from CRLF to LF (for windows user only)
Sometimes when running the file there might be some errors like ```exec ./importDB.sh: no such file or directory```. 

![image](https://github.com/user-attachments/assets/772fa24a-8e3d-403e-b2ae-2bb687eab8d7)

This is due to the code running in CRLF as the end of line sequence. This only hapens in windows only, to check if it is LF or CRLF, go to any codefile and check on the bottom right.

![image](https://github.com/user-attachments/assets/ef6a8605-f32f-4d33-8884-52f79d8a684b)


If it says CRLF, click on it and then it show up as a list of end of line sequence containing LF and CRLF.

![image](https://github.com/user-attachments/assets/3c6d6773-720a-478f-bb68-578f05a45c21)


Pick the one on the image shown above.

Once it is done, it should change to LF on the bottom, make sure to save after for it to work.

![image](https://github.com/user-attachments/assets/ca9f16ab-4b83-4c56-bbb1-915b764a0b3a)

After that run it again using ```docker compose up --build``` (if the rest of the containers are running, stop it using ```Ctrl+C```), and it should work.

![image](https://github.com/user-attachments/assets/9d60f422-5499-4f51-b9ae-0b7a8fa9c99d)

*(No errors shown here, it would return ```exited with code [number]```, in this case 255)*
