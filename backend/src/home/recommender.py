import pandas as pd
from surprise import Dataset, Reader, KNNBasic
from surprise.model_selection import train_test_split

# Example list of data
data_list = [
    ['user1', 'item1', 4],
    ['user1', 'item2', 5],
    ['user2', 'item1', 3],
    ['user2', 'item3', 2],
    ['user3', 'item2', 1],
    ['user3', 'item3', 4]
]

# Convert the list of data to a pandas DataFrame
df = pd.DataFrame(data_list, columns=['user', 'item', 'rating'])

# Define the rating scale
reader = Reader(rating_scale=(1, 5))

# Load the dataset using the defined rating scale
data = Dataset.load_from_df(df[['user', 'item', 'rating']], reader)

# Split the dataset into training and testing sets
trainset, testset = train_test_split(data, test_size=0.2)

# Create an instance of the collaborative filtering algorithm
algo = KNNBasic()

# Train the algorithm on the training set
algo.fit(trainset)

# Specify the list of users for whom you want to generate recommendations
user_ids = ['user1', 'user2', 'user3']

# Generate recommendations for each user
for user_id in user_ids:
    # Get a list of all items in the dataset
    all_items = trainset.all_items()

    # Filter out the items that the user has already rated
    rated_items = [item_id for (item_id, _) in trainset.ur[trainset.to_inner_uid(user_id)]]
    items_to_rate = [item_id for item_id in all_items if item_id not in rated_items]

    # Make predictions for the user-item pairs
    predictions = algo.test([(trainset.to_inner_uid(user_id), item_id, 4.0) for item_id in items_to_rate])

    # Sort the predictions by the estimated rating
    top_predictions = sorted(predictions, key=lambda x: x.est, reverse=True)

    # Print the recommended items for the user
    print(f"User: {user_id}")
    for prediction in top_predictions[:5]:
        print(f"Item: {prediction.iid}, Predicted Rating: {prediction.est}")
    print()
